import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { accounts, organizations, sessions, users, type Account, type Organization, type User } from "@/db/schema";
import { can, type Permission } from "./permissions";

export const SESSION_COOKIE = "apm_session";
const SESSION_DAYS = 30;
const READ_ONLY_HOURS = 4;

/** The signed-in membership (one person in one agency). */
export type SessionUser = User & {
  /** Read-only session: every write is refused. */
  readOnly: boolean;
};

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
export const newToken = () => randomBytes(32).toString("base64url");

let dummyHash: string | undefined;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

/**
 * Email + password check against the person's account (one password across all their agencies).
 * Compares against a dummy hash when there's no account, so timing doesn't reveal who has one.
 */
export async function verifyAccount(email: string, password: string): Promise<Account | null> {
  const account = await db.query.accounts.findFirst({ where: eq(accounts.email, email.trim().toLowerCase()) });
  dummyHash ??= await bcrypt.hash(randomBytes(12).toString("hex"), 10);
  const ok = await bcrypt.compare(password, account?.passwordHash ?? dummyHash);
  return account && ok ? account : null;
}

/** The person behind a membership (email, verification status). */
export const getAccount = cache(async (accountId: string) => db.query.accounts.findFirst({ where: eq(accounts.id, accountId) }));

export type Membership = { user: User; org: Organization };

/** The agencies a person can sign in to: their active memberships. */
export async function membershipsOf(accountId: string): Promise<Membership[]> {
  const rows = await db
    .select({ user: users, org: organizations })
    .from(users)
    .innerJoin(organizations, eq(organizations.id, users.orgId))
    .where(
and(eq(users.accountId, accountId), eq(users.active, true)),
    )
    .orderBy(organizations.name);
  return rows;
}

/** Signs a membership in on this browser: 30 days, or `hours` (read-only sessions: 4 hours). */
export async function createSession(userId: string, opts: { readOnly?: boolean; hours?: number } = {}) {
  const token = newToken();
  const ms = opts.hours ? opts.hours * 3600_000 : opts.readOnly ? READ_ONLY_HOURS * 3600_000 : SESSION_DAYS * 86_400_000;
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

/** Current user for this request (memoized per request). */
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
  return { ...row.user, readOnly: row.readOnly };
});

export class ReadOnlyError extends Error {
  constructor() {
    super("READ_ONLY_PREVIEW");
  }
}

/**
 * The single choke point for read-only sessions: any server action (a write) from a read-only
 * session is refused here, before the action runs any of its own logic.
 */
async function assertWritableRequest(user: SessionUser) {
  if (!user.readOnly) return;
  if ((await headers()).has("next-action")) throw new ReadOnlyError();
}

/** The signed-in membership, for pages and server actions. Refuses writes from read-only sessions. */
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
