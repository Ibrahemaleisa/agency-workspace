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
import { markWelcomed, requestPlan } from "@/lib/billing/manual";
import { MAX_UPLOAD_BYTES, saveFile } from "@/lib/uploads";
import { getSaasT } from "@/lib/i18n-saas";
import type { ActionState } from "@/lib/action-state";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";

/**
 * Admin: pay for a plan. The form may name the plan (chosen on the billing page); a free trial moves
 * to it first. After paying, the provider returns the admin to the workspace itself.
 */
export async function startCheckout(fd?: FormData) {
  const user = await requireUser({ allowLocked: true });
  assertCan(user, "billing.manage");
  const provider = billingProvider();
  const org = await getOrgById(user.orgId);
  let sub = await getSubscription(user.orgId);
  const chosen = fd?.get("plan");
  if (typeof chosen === "string" && sub && !sub.providerSubscriptionId && chosen !== sub.planCode) {
    const next = await getPlan(chosen);
    if (next?.active) {
      await db.update(subscriptions).set({ planCode: next.code, updatedAt: new Date() }).where(eq(subscriptions.orgId, user.orgId));
      sub = { ...sub, planCode: next.code };
    }
  }
  const plan = sub ? await getPlan(sub.planCode) : null;
  if (!provider || !org || !sub || !plan || org.isDemo) redirect("/settings/billing?checkout=unavailable");
  const base = tenantBaseUrl(org);
  let url: string;
  try {
    url = await provider.createCheckout({
      org,
      plan,
      email: user.email,
      // Subscribing mid-trial keeps the remaining free days (billing starts when the trial ends).
      trialEndsAt: effectiveStatus(sub) === "trialing" ? sub.trialEndsAt : null,
      successUrl: `${base}/?subscribed=1`,
      cancelUrl: `${base}/settings/billing?checkout=cancelled`,
    });
  } catch (err) {
    console.error("[checkout failed]", err);
    redirect("/settings/billing?checkout=error");
  }
  await logActivity(user, { action: "billing.checkout", summary: "started checkout", params: {} });
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
  await logActivity(user, { action: "billing.plan", summary: `changed plan to ${plan.name}`, params: { plan: plan.name, planAr: plan.nameAr ?? "" } });
  redirect("/settings/billing?plan=changed");
}

/** Admin, without online payment: ask Operra to activate a plan (staff activate it once paid). */
export async function requestPlanAction(fd: FormData) {
  const user = await requireUser({ allowLocked: true });
  assertCan(user, "billing.manage");
  const code = String(fd.get("plan") ?? "");
  const req = await requestPlan(user.orgId, code, user.id);
  if (!req) redirect("/settings/billing");
  const requested = await getPlan(code);
  await logActivity(user, { action: "billing.request", summary: `chose the ${requested?.name ?? code} plan`, params: { plan: requested?.name ?? code, planAr: requested?.nameAr ?? "" } });
  redirect("/settings/billing?requested=1");
}

const RECEIPT_TYPES = ["image/png", "image/jpeg", "image/webp", "application/pdf"];

/**
 * Admin: "I've made the transfer" — the plan, months paid for and the receipt. The workspace keeps
 * working (grace if needed) while Operra checks the transfer and activates the plan.
 */
export async function submitTransfer(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser({ allowLocked: true });
  assertCan(user, "billing.manage");
  const e = (await getSaasT()).t.pay.errors;
  const plan = await getPlan(String(fd.get("plan") ?? ""));
  if (!plan?.active || plan.priceCents == null) return { error: e.plan };
  const months = [1, 3, 6, 12].includes(Number(fd.get("months"))) ? Number(fd.get("months")) : 1;
  const file = fd.get("receipt");
  if (!(file instanceof File) || file.size === 0) return { error: e.receipt };
  if (!RECEIPT_TYPES.includes(file.type)) return { error: e.receiptType };
  if (file.size > MAX_UPLOAD_BYTES) return { error: e.receiptSize };
  const safe = file.name.replace(/[^\w.\-]+/g, "_").slice(-80) || "receipt";
  const key = `receipts/${user.orgId}/${randomUUID()}-${safe}`;
  await saveFile(key, Buffer.from(await file.arrayBuffer()), file.type);
  const req = await requestPlan(user.orgId, plan.code, user.id, {
    months,
    amountCents: plan.priceCents * months,
    currency: plan.currency,
    receipt: { key, name: file.name.slice(0, 120), type: file.type },
  });
  if (!req) return { error: e.plan };
  await logActivity(user, { action: "billing.transfer", summary: `sent a bank transfer receipt for ${plan.name}`, params: { plan: plan.name, planAr: plan.nameAr ?? "" } });
  redirect("/settings/billing?requested=1");
}

/** The agency's admin closed the "you're subscribed" welcome after a staff activation. */
export async function dismissActivationWelcome() {
  const user = await requireUser({ allowLocked: true });
  assertCan(user, "billing.manage");
  await markWelcomed(user.orgId);
}

/** Admin: open the provider's self-service billing portal. */
export async function openBillingPortal() {
  const user = await requireUser({ allowLocked: true });
  assertCan(user, "billing.manage");
  const provider = billingProvider();
  const org = await getOrgById(user.orgId);
  const sub = await getSubscription(user.orgId);
  if (!provider || !org || !sub?.providerCustomerId) redirect("/settings/billing");
  const url = await provider.portalUrl({
    customerId: sub.providerCustomerId,
    subscriptionId: sub.providerSubscriptionId,
    returnUrl: `${tenantBaseUrl(org)}/settings/billing`,
  });
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
  const plan = await getPlan(data.planCode);
  const now = Date.now();
  await applyBillingEvent({
    provider: "test",
    eventId: `test_evt_${randomUUID()}`,
    type: "test.subscription.activated",
    orgId: data.orgId,
    customerId: `test_cus_${data.orgId}`,
    subscriptionId: `test_sub_${data.orgId}`,
    status: "active",
    currentPeriodEnd: new Date(now + 30 * 86_400_000),
    cancelAtPeriodEnd: false,
    invoice: plan?.priceCents
      ? {
          providerInvoiceId: `test_in_${randomUUID()}`,
          amountCents: plan.priceCents,
          currency: plan.currency,
          planCode: plan.code,
          periodStart: new Date(now),
          periodEnd: new Date(now + 30 * 86_400_000),
        }
      : undefined,
    raw: { simulated: true, planCode: data.planCode, at: new Date().toISOString() },
  });
  redirect(data.successUrl);
}
