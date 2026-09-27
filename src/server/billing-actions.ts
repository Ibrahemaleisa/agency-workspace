"use server";

import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { requireUser } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";
import { applyBillingEvent, billingProvider, effectiveStatus, getPlan, getSubscription } from "@/lib/billing";
import { tenantBaseUrl } from "@/lib/platform";
import { getOrgById } from "@/lib/tenant";
import { verify } from "@/lib/secret";
import { logActivity } from "@/lib/events";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";

/** Admin: send the tenant to the provider's checkout for its plan. */
export async function startCheckout() {
  const user = await requireUser({ allowLocked: true });
  assertCan(user, "billing.manage");
  const provider = billingProvider();
  const org = await getOrgById(user.orgId);
  const sub = await getSubscription(user.orgId);
  const plan = sub ? await getPlan(sub.planCode) : null;
  if (!provider || !org || !sub || !plan || org.isDemo) redirect("/settings/billing?checkout=unavailable");
  const base = `${tenantBaseUrl(org)}/settings/billing`;
  let url: string;
  try {
    url = await provider.createCheckout({
      org,
      plan,
      email: user.email,
      // Subscribing mid-trial keeps the remaining free days (billing starts when the trial ends).
      trialEndsAt: effectiveStatus(sub) === "trialing" ? sub.trialEndsAt : null,
      successUrl: `${base}?checkout=success`,
      cancelUrl: `${base}?checkout=cancelled`,
    });
  } catch (err) {
    console.error("[checkout failed]", err);
    redirect("/settings/billing?checkout=error");
  }
  await logActivity(user, { action: "billing.checkout", summary: "started checkout" });
  redirect(url);
}

/**
 * Admin: move a trial (running or ended) to another plan on offer. Paid subscriptions change plan
 * with the payment provider instead (Manage billing), so they're left alone here.
 */
export async function changePlan(fd: FormData) {
  const user = await requireUser({ allowLocked: true });
  assertCan(user, "billing.manage");
  const code = String(fd.get("plan") ?? "");
  const [sub, plan, org] = await Promise.all([getSubscription(user.orgId), getPlan(code), getOrgById(user.orgId)]);
  if (!sub || !plan || !plan.active || !org || org.isDemo || sub.providerSubscriptionId || sub.planCode === code) {
    redirect("/settings/billing");
  }
  await db.update(subscriptions).set({ planCode: code, updatedAt: new Date() }).where(eq(subscriptions.orgId, user.orgId));
  await logActivity(user, { action: "billing.plan", summary: `changed plan to ${plan.name}` });
  redirect("/settings/billing?plan=changed");
}

/** Admin: open the provider's self-service billing portal. */
export async function openBillingPortal() {
  const user = await requireUser({ allowLocked: true });
  assertCan(user, "billing.manage");
  const provider = billingProvider();
  const org = await getOrgById(user.orgId);
  const sub = await getSubscription(user.orgId);
  if (!provider || !org || !sub?.providerCustomerId) redirect("/settings/billing");
  const url = await provider.portalUrl({ customerId: sub.providerCustomerId, returnUrl: `${tenantBaseUrl(org)}/settings/billing` });
  redirect(url ?? "/settings/billing");
}

type TestCheckout = { orgId: string; planCode: string; successUrl: string; cancelUrl: string };

/**
 * TEST MODE ONLY. Simulates the provider confirming a subscription, through the same
 * idempotent event path as real webhooks. Refused unless the test provider is active.
 */
export async function completeTestCheckout(fd: FormData) {
  const token = String(fd.get("t") ?? "");
  const data = verify<TestCheckout>(token);
  if (!data || billingProvider()?.name !== "test") redirect("/login");
  const outcome = fd.get("outcome") === "cancel" ? "cancel" : "pay";
  if (outcome === "cancel") redirect(data.cancelUrl);
  await applyBillingEvent({
    provider: "test",
    eventId: `test_evt_${randomUUID()}`,
    type: "test.subscription.activated",
    orgId: data.orgId,
    customerId: `test_cus_${data.orgId}`,
    subscriptionId: `test_sub_${data.orgId}`,
    status: "active",
    currentPeriodEnd: new Date(Date.now() + 30 * 86_400_000),
    cancelAtPeriodEnd: false,
    raw: { simulated: true, planCode: data.planCode, at: new Date().toISOString() },
  });
  redirect(data.successUrl);
}
