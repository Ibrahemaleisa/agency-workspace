import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq, gt, isNull, lt, ne } from "drizzle-orm";
import { db } from "@/db";
import { clients, passwordResets, sessions, users, type User } from "@/db/schema";
import { can, type Permission } from "./permissions";

export const SESSION_COOKIE = "apm_session";
const SESSION_DAYS = 30;

export type SessionUser = Omit<User, "passwordHash">;

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyCredentials(email: string, password: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email.trim().toLowerCase()),
  });
  // Compare against a dummy hash for unknown emails so response time doesn't reveal which emails exist.
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  return ok && user?.active && (await clientIsActive(user)) ? user : null;
}

/** Portal users of a client the agency marked inactive can no longer use the workspace. */
async function clientIsActive(user: Pick<User, "role" | "clientId">) {
  if (user.role !== "client" || !user.clientId) return true;
  const client = await db.query.clients.findFirst({ where: eq(clients.id, user.clientId), columns: { active: true } });
  return !!client?.active;
}

const DUMMY_HASH = "$2b$10$33547ZV1oJKb/rRyWdFwl..m4G134Gm2BE4Ak.KvFNTNhIXidrD.e";

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(sessions).values({ id: hashToken(token), userId, expiresAt });
  // Housekeeping: drop sessions that have expired (indexed on expires_at, so this stays cheap).
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.id, hashToken(token)));
  store.delete(SESSION_COOKIE);
}

/** Current user for this request (memoized per request). */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [row] = await db
    .select({ user: users, clientActive: clients.active })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .leftJoin(clients, eq(clients.id, users.clientId))
    .where(and(eq(sessions.id, hashToken(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);
  if (!row || !row.user.active) return null;
  if (row.user.role === "client" && !row.clientActive) return null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...user } = row.user;
  return user;
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** For pages: redirect away when the permission is missing. */
export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const user = await requireUser();
  if (!can(user, permission)) redirect("/");
  return user;
}

/** Sign the user out everywhere except (optionally) the current browser. */
export async function revokeOtherSessions(userId: string) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  await db
    .delete(sessions)
    .where(and(eq(sessions.userId, userId), token ? ne(sessions.id, hashToken(token)) : undefined));
}

/* ------------------------------------------------------------------ */
/* Forgot password                                                     */
/* ------------------------------------------------------------------ */

const RESET_MINUTES = 60;

/** Create a one-time reset token for an active user; returns the raw token (to email) or null. */
export async function createPasswordReset(email: string) {
  const user = await db.query.users.findFirst({ where: eq(users.email, email.trim().toLowerCase()) });
  if (!user || !user.active) return null;
  const token = randomBytes(32).toString("base64url");
  await db.delete(passwordResets).where(eq(passwordResets.userId, user.id));
  await db.insert(passwordResets).values({
    id: hashToken(token),
    userId: user.id,
    expiresAt: new Date(Date.now() + RESET_MINUTES * 60 * 1000),
  });
  return { token, user };
}

/** The user a still-valid, unused reset token belongs to. */
export async function findPasswordReset(token: string) {
  const [row] = await db
    .select({ userId: passwordResets.userId })
    .from(passwordResets)
    .innerJoin(users, eq(users.id, passwordResets.userId))
    .where(
      and(
        eq(passwordResets.id, hashToken(token)),
        isNull(passwordResets.usedAt),
        gt(passwordResets.expiresAt, new Date()),
        eq(users.active, true),
      ),
    )
    .limit(1);
  return row ?? null;
}

/** Use a reset token: set the new password, end every session, burn the token. */
export async function consumePasswordReset(token: string, password: string) {
  const reset = await findPasswordReset(token);
  if (!reset) return null;
  const [used] = await db
    .update(passwordResets)
    .set({ usedAt: new Date() })
    .where(and(eq(passwordResets.id, hashToken(token)), isNull(passwordResets.usedAt)))
    .returning();
  if (!used) return null; // lost a race with a second submit
  await db.update(users).set({ passwordHash: await hashPassword(password) }).where(eq(users.id, reset.userId));
  await db.delete(sessions).where(eq(sessions.userId, reset.userId));
  return reset.userId;
}
