import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { accounts, loginTokens, organizations, sessions, users, type Account, type Organization, type User } from "@/db/schema";
import { can, type Permission } from "./permissions";
import { getHostTenant, getOrgById } from "./tenant";
import { getSubscription, hasAccess } from "./billing";
import { isPlatform } from "./platform";

export const SESSION_COOKIE = "apm_session";
const SESSION_DAYS = 30;
const PREVIEW_HOURS = 4;

/** The signed-in membership (one person in one agency). */
export type SessionUser = User & {
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

/**
 * The agencies a person can sign in to: active memberships, optionally only in one tenant.
 * In platform mode the demo tenant is excluded — it's reached through /preview, never a password.
 */
export async function membershipsOf(accountId: string, opts: { tenantId?: string | null } = {}): Promise<Membership[]> {
  const rows = await db
    .select({ user: users, org: organizations })
    .from(users)
    .innerJoin(organizations, eq(organizations.id, users.orgId))
    .where(
      and(
        eq(users.accountId, accountId),
        eq(users.active, true),
        opts.tenantId ? eq(users.orgId, opts.tenantId) : undefined,
        isPlatform() ? eq(organizations.isDemo, false) : undefined,
      ),
    )
    .orderBy(organizations.name);
  return rows;
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
  return { ...row.user, readOnly: row.readOnly };
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

export class WorkspaceLockedError extends Error {
  constructor() {
    super("WORKSPACE_LOCKED");
  }
}

/**
 * Platform mode: a paused workspace, or one whose trial ended without a subscription, can't make
 * changes. Pages show their own gate; this stops server actions posted directly.
 */
async function assertWorkspaceOpen(user: SessionUser) {
  if (!isPlatform() || user.readOnly) return;
  if (!(await headers()).has("next-action")) return;
  const [org, sub] = await Promise.all([getOrgById(user.orgId), getSubscription(user.orgId)]);
  if (!org || org.status !== "active" || !hasAccess(org, sub)) throw new WorkspaceLockedError();
}

/**
 * The signed-in membership, for pages and server actions. Refuses writes from read-only previews
 * and from locked workspaces — except where `allowLocked` (billing, switching agency, verification)
 * is how a locked workspace gets back in.
 */
export async function requireUser(opts: { allowLocked?: boolean } = {}): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await assertWritableRequest(user);
  if (!opts.allowLocked) await assertWorkspaceOpen(user);
  return user;
}

/** For pages: redirect away when the permission is missing. */
export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const user = await requireUser();
  if (!can(user, permission)) redirect("/");
  return user;
}
