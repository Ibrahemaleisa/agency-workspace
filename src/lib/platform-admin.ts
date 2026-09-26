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
 * own table, own session table, own cookie (path-scoped to /operra, SameSite=Strict, 8 hours).
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

export async function createPlatformSession(adminId: string) {
  const token = newToken();
  const expiresAt = new Date(Date.now() + HOURS * 3600_000);
  await db.insert(platformSessions).values({ id: hashToken(token), adminId, expiresAt });
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

export const getPlatformAdmin = cache(async () => {
  await guardHost();
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const [row] = await db
    .select({ admin: platformAdmins })
    .from(platformSessions)
    .innerJoin(platformAdmins, eq(platformAdmins.id, platformSessions.adminId))
    .where(and(eq(platformSessions.id, hashToken(token)), gt(platformSessions.expiresAt, new Date())))
    .limit(1);
  return row && row.admin.active ? { id: row.admin.id, email: row.admin.email, name: row.admin.name } : null;
});

export async function requirePlatformAdmin() {
  const admin = await getPlatformAdmin();
  if (!admin) redirect("/operra/login");
  return admin;
}
