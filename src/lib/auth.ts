import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { loginTokens, organizations, sessions, users, type User } from "@/db/schema";
import { can, type Permission } from "./permissions";
import { getHostTenant } from "./tenant";
import { isPlatform } from "./platform";

export const SESSION_COOKIE = "apm_session";
const SESSION_DAYS = 30;
const PREVIEW_HOURS = 4;

export type SessionUser = Omit<User, "passwordHash"> & {
  /** Preview session into the demo tenant: every write is refused. */
  readOnly: boolean;
};

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
export const newToken = () => randomBytes(32).toString("base64url");

let dummyHash: string | undefined;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

/**
 * Email + password check. Emails are unique across the platform, so the user's tenant is known.
 * On a tenant host (or its branded /w/ page) only that tenant's people can sign in; demo-tenant
 * accounts can't sign in with a password in platform mode (they are reached through /preview).
 */
export async function verifyCredentials(email: string, password: string, tenantId?: string | null) {
  const [row] = await db
    .select({ user: users, isDemo: organizations.isDemo })
    .from(users)
    .innerJoin(organizations, eq(organizations.id, users.orgId))
    .where(eq(users.email, email.trim().toLowerCase()))
    .limit(1);
  // Compare against a dummy hash when the user doesn't exist, so timing doesn't reveal accounts.
  dummyHash ??= await bcrypt.hash(randomBytes(12).toString("hex"), 10);
  const hash = row?.user.passwordHash ?? dummyHash;
  const ok = await bcrypt.compare(password, hash);
  if (!row || !ok || !row.user.active) return null;
  if (isPlatform() && row.isDemo) return null;
  if (tenantId && row.user.orgId !== tenantId) return null;
  return row.user;
}

export async function createSession(userId: string, opts: { readOnly?: boolean } = {}) {
  const token = newToken();
  const ms = opts.readOnly ? PREVIEW_HOURS * 3600_000 : SESSION_DAYS * 86_400_000;
  const expiresAt = new Date(Date.now() + ms);
  await db.insert(sessions).values({ id: hashToken(token), userId, expiresAt, readOnly: !!opts.readOnly });
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

/** Single-use, 2-minute token that carries a sign-in to another host (tenant subdomain / custom domain). */
export async function createLoginToken(userId: string) {
  const token = newToken();
  await db.insert(loginTokens).values({ tokenHash: hashToken(token), userId, expiresAt: new Date(Date.now() + 120_000) });
  return token;
}

/** Redeems a handoff token exactly once. Returns the user id, or null. */
export async function consumeLoginToken(token: string) {
  const [row] = await db
    .update(loginTokens)
    .set({ usedAt: new Date() })
    .where(and(eq(loginTokens.tokenHash, hashToken(token)), isNull(loginTokens.usedAt), gt(loginTokens.expiresAt, new Date())))
    .returning({ userId: loginTokens.userId });
  return row?.userId ?? null;
}

/**
 * Current user for this request (memoized per request).
 * A session only counts on its own tenant's host: a cookie can never cross into another tenant.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [row] = await db
    .select({ user: users, readOnly: sessions.readOnly })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, hashToken(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);
  if (!row || !row.user.active) return null;
  const host = await getHostTenant();
  if (host && host.id !== row.user.orgId) return null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...user } = row.user;
  return { ...user, readOnly: row.readOnly };
});

export class ReadOnlyError extends Error {
  constructor() {
    super("READ_ONLY_PREVIEW");
  }
}

/**
 * The single choke point for preview sessions: any server action (a write) from a read-only
 * session is refused here, before the action runs any of its own logic.
 */
async function assertWritableRequest(user: SessionUser) {
  if (!user.readOnly) return;
  if ((await headers()).has("next-action")) throw new ReadOnlyError();
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertWritableRequest(user);
  return user;
}

/** For pages: redirect away when the permission is missing. */
export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const user = await requireUser();
  if (!can(user, permission)) redirect("/");
  return user;
}
