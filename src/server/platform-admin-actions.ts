"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { organizations, sessions, subscriptions, users } from "@/db/schema";
import { createPlatformSession, destroyPlatformSession, requirePlatformAdmin, verifyPlatformAdmin } from "@/lib/platform-admin";
import { str, type ActionState } from "@/lib/action-state";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { isUuid } from "@/lib/access";

export async function platformLogin(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const email = str(fd, "email")?.toLowerCase() ?? "";
  const password = str(fd, "password") ?? "";
  if (!(await rateLimit(`operra-login:${await clientIp()}`, 10, 900))) return { error: "Too many attempts. Try again later." };
  const admin = email && password ? await verifyPlatformAdmin(email, password) : null;
  if (!admin) return { error: "Invalid email or password." };
  await createPlatformSession(admin.id);
  console.info("[control-center] sign-in", { admin: admin.email });
  redirect("/operra");
}

export async function platformLogout() {
  await destroyPlatformSession();
  redirect("/operra/login");
}

/** Pause or restore a tenant. Pausing also ends its users' sessions. */
export async function setTenantStatus(fd: FormData) {
  const admin = await requirePlatformAdmin();
  const orgId = str(fd, "orgId") ?? "";
  const status = str(fd, "status");
  if (!isUuid(orgId) || (status !== "active" && status !== "suspended")) return;
  const org = await db.query.organizations.findFirst({ where: eq(organizations.id, orgId) });
  if (!org || org.isDemo) return;
  await db.update(organizations).set({ status, updatedAt: new Date() }).where(eq(organizations.id, orgId));
  if (status === "suspended") {
    await db.delete(sessions).where(sql`${sessions.userId} in (select ${users.id} from ${users} where ${users.orgId} = ${orgId})`);
  }
  console.info("[control-center] tenant status", { admin: admin.email, serial: org.serial, status });
  revalidatePath(`/operra/customers/${orgId}`);
}

/** Extend a trial by N days from today or from its current end, whichever is later. */
export async function extendTrial(fd: FormData) {
  const admin = await requirePlatformAdmin();
  const orgId = str(fd, "orgId") ?? "";
  const days = Math.min(90, Math.max(1, Number(str(fd, "days") ?? 0) || 0));
  if (!isUuid(orgId)) return;
  const sub = await db.query.subscriptions.findFirst({ where: eq(subscriptions.orgId, orgId) });
  if (!sub || sub.status === "active") return;
  const from = Math.max(Date.now(), sub.trialEndsAt?.getTime() ?? 0);
  await db
    .update(subscriptions)
    .set({ status: "trialing", trialEndsAt: new Date(from + days * 86_400_000), updatedAt: new Date() })
    .where(eq(subscriptions.orgId, orgId));
  console.info("[control-center] trial extended", { admin: admin.email, orgId, days });
  revalidatePath(`/operra/customers/${orgId}`);
}
