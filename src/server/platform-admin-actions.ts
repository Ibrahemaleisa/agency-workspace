"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { organizations, plans, sessions, subscriptions, users } from "@/db/schema";
import { createPlatformSession, destroyPlatformSession, requirePlatformAdmin, verifyPlatformAdmin } from "@/lib/platform-admin";
import { idOf, str, type ActionState } from "@/lib/action-state";
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
  const orgId = idOf(fd, "orgId");
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
  const orgId = idOf(fd, "orgId");
  const days = Math.min(90, Math.max(1, Number(str(fd, "days") ?? 0) || 0));
  if (!isUuid(orgId)) return;
  const sub = await db.query.subscriptions.findFirst({ where: eq(subscriptions.orgId, orgId) });
  // Only free trials (running or ended); anything backed by the payment provider is managed there.
  if (!sub || sub.status === "active" || sub.providerSubscriptionId) return;
  const from = Math.max(Date.now(), sub.trialEndsAt?.getTime() ?? 0);
  await db
    .update(subscriptions)
    .set({ status: "trialing", trialEndsAt: new Date(from + days * 86_400_000), updatedAt: new Date() })
    .where(eq(subscriptions.orgId, orgId));
  console.info("[control-center] trial extended", { admin: admin.email, orgId, days });
  revalidatePath(`/operra/customers/${orgId}`);
}

/**
 * Edit a plan: trial length, display price, provider price ID, availability. Changes apply to new
 * sign-ups and checkouts; running trials keep their end dates.
 */
export async function updatePlan(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requirePlatformAdmin();
  const code = str(fd, "code") ?? "";
  const plan = await db.query.plans.findFirst({ where: eq(plans.code, code) });
  if (!plan) return { error: "Unknown plan." };
  const name = str(fd, "name")?.slice(0, 80);
  const trialDays = Number(str(fd, "trialDays"));
  if (!name) return { error: "Name is required." };
  if (!Number.isInteger(trialDays) || trialDays < 0 || trialDays > 90) return { error: "Trial length must be 0–90 days." };
  // Display price: blank = not published ("priced on request"). Stripe holds the real price.
  const priceRaw = str(fd, "price");
  const price = priceRaw ? Number(priceRaw) : null;
  if (price !== null && (!Number.isFinite(price) || price < 0 || price > 1_000_000)) return { error: "Price must be a positive number, or blank." };
  const currency = (str(fd, "currency") ?? "USD").toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) return { error: "Currency must be a 3-letter code, e.g. USD or SAR." };
  const interval = str(fd, "interval") === "year" ? "year" : "month";
  const stripePriceId = str(fd, "stripePriceId");
  if (stripePriceId && !/^price_[A-Za-z0-9]+$/.test(stripePriceId)) return { error: "Stripe price IDs look like price_…" };

  await db
    .update(plans)
    .set({
      name,
      trialDays,
      priceCents: price === null ? null : Math.round(price * 100),
      currency,
      interval,
      stripePriceId,
      active: str(fd, "active") === "on",
    })
    .where(eq(plans.code, code));
  console.info("[control-center] plan updated", { admin: admin.email, code, trialDays, price, currency, interval, stripePriceId });
  revalidatePath("/operra/plans");
  return { ok: true };
}
