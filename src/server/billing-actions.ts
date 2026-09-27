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
