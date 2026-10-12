import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { platformAdmins, platformSessions } from "@/db/schema";
import { hashToken, newToken } from "./auth";
import { isPlatform } from "./platform";
import { getHostTenant } from "./tenant";

/*
 * Operra staff authentication — deliberately separate from tenant users:
 * own table, own session table, own cookie (path-scoped to /operra, SameSite=Strict, 8 hours), and a
 * required second factor (an authenticator app code, lib/totp.ts) on every sign-in.
 * The control center only answers on the platform's own host, never on a tenant host.
 */
const COOKIE = "operra_admin";
const HOURS = 8;

async function guardHost() {
  if (!isPlatform() || (await getHostTenant())) notFound();
}

export async function verifyPlatformAdmin(email: string, password: string) {
  const admin = await db.query.platformAdmins.findFirst({ where: eq(platformAdmins.email, email.trim().toLowerCase()) });
  if (!admin) {
    await bcrypt.hash(password, 12); // same cost as a real check, so timing doesn't reveal accounts
    return null;
  }
  const ok = await bcrypt.compare(password, admin.passwordHash);
  return admin.active && ok ? admin : null;
}

export async function createPlatformSession(adminId: string, opts: { pending2fa?: boolean } = {}) {
  const token = newToken();
  // Waiting for the authenticator code: a short window, then the password is needed again.
  const expiresAt = new Date(Date.now() + (opts.pending2fa ? 10 * 60_000 : HOURS * 3600_000));
  await db.insert(platformSessions).values({ id: hashToken(token), adminId, expiresAt, pending2fa: !!opts.pending2fa });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/operra",
    expires: expiresAt,
  });
}

export async function destroyPlatformSession() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) await db.delete(platformSessions).where(eq(platformSessions.id, hashToken(token)));
  store.set(COOKIE, "", { path: "/operra", maxAge: 0 });
}

export type PlatformAdmin = { id: string; email: string; name: string };

/**
 * This browser's control-center session: who, whether the authenticator code is still owed
 * (pending2fa) and whether they have set up an authenticator yet (enrolled).
 */
export const getPlatformSession = cache(async () => {
  await guardHost();
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const [row] = await db
    .select({ admin: platformAdmins, pending2fa: platformSessions.pending2fa })
    .from(platformSessions)
    .innerJoin(platformAdmins, eq(platformAdmins.id, platformSessions.adminId))
    .where(and(eq(platformSessions.id, hashToken(token)), gt(platformSessions.expiresAt, new Date())))
    .limit(1);
  if (!row || !row.admin.active) return null;
  return {
    admin: { id: row.admin.id, email: row.admin.email, name: row.admin.name } satisfies PlatformAdmin,
    pending2fa: row.pending2fa,
    enrolled: !!row.admin.totpEnabledAt,
    tokenHash: hashToken(token),
  };
});

/** A fully signed-in staff member (password + authenticator code, authenticator set up), or null. */
export async function getPlatformAdmin(): Promise<PlatformAdmin | null> {
  const s = await getPlatformSession();
  return s && !s.pending2fa && s.enrolled ? s.admin : null;
}

/**
 * For control-center pages and actions. Sends the person to finish signing in (authenticator code)
 * or to set up an authenticator first — the only page reachable before that is the set-up page.
 */
export async function requirePlatformAdmin(opts: { enrolling?: boolean } = {}): Promise<PlatformAdmin> {
  const s = await getPlatformSession();
  if (!s) redirect("/operra/login");
  if (s.pending2fa) redirect("/operra/login/2fa");
  if (!s.enrolled && !opts.enrolling) redirect("/operra/security");
  return s.admin;
}

/** After a correct authenticator code: the session is fully signed in. */
export async function completeSecondFactor(tokenHash: string) {
  await db.update(platformSessions).set({ pending2fa: false, expiresAt: new Date(Date.now() + HOURS * 3600_000) }).where(eq(platformSessions.id, tokenHash));
  (await cookies()).set(COOKIE, (await cookies()).get(COOKIE)!.value, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/operra",
    expires: new Date(Date.now() + HOURS * 3600_000),
  });
}
