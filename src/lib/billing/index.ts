import "server-only";
import { cache } from "react";
import { and, eq, isNull, lt } from "drizzle-orm";
import { db } from "@/db";
import { billingEvents, plans, subscriptions, type Organization, type Subscription } from "@/db/schema";
import { appUrl, isPlatform } from "../platform";
import { sign } from "../secret";
import { stripeProvider } from "./stripe";
import type { BillingEvent, BillingProvider, ProviderName } from "./types";

export type { BillingEvent };

/**
 * The active payment provider:
 * - "stripe" when STRIPE_SECRET_KEY is set (or BILLING_PROVIDER=stripe);
 * - "test" only when BILLING_PROVIDER=test, and never in production unless ALLOW_TEST_BILLING=true;
 * - null: no online payment — workspaces run on their trial and are billed manually.
 * Always null outside platform mode: single-agency deployments are billed outside the app.
 */
export function providerName(): ProviderName | null {
  if (!isPlatform()) return null;
  const chosen = process.env.BILLING_PROVIDER;
  if (chosen === "test") {
    const allowed = process.env.NODE_ENV !== "production" || process.env.ALLOW_TEST_BILLING === "true";
    return allowed ? "test" : null;
  }
  if (chosen === "stripe" || (!chosen && process.env.STRIPE_SECRET_KEY)) return process.env.STRIPE_SECRET_KEY ? "stripe" : null;
  return null;
}

/** Test provider: a clearly labelled page that simulates the provider's confirmation. Never charges. */
const testProvider: BillingProvider = {
  name: "test",
  async createCheckout({ org, plan, successUrl, cancelUrl }) {
    const token = sign({ orgId: org.id, planCode: plan.code, successUrl, cancelUrl }, 30 * 60);
    return `${appUrl()}/billing/test-checkout?t=${encodeURIComponent(token)}`;
  },
  async portalUrl() {
    return null;
  },
};

export function billingProvider(): BillingProvider | null {
  const name = providerName();
  return name === "stripe" ? stripeProvider : name === "test" ? testProvider : null;
}

export const getSubscription = cache((orgId: string) => db.query.subscriptions.findFirst({ where: eq(subscriptions.orgId, orgId) }));

/** A plan by code (plans live in the database: trial length, display price, provider price ID). */
export const getPlan = (code: string) => db.query.plans.findFirst({ where: eq(plans.code, code) });

type SubState = Pick<Subscription, "status" | "trialEndsAt" | "providerSubscriptionId">;

/**
 * What a subscription means right now. A free trial whose end has passed is "expired" at once —
 * the daily job (expireTrials) only records it; access never waits for the job.
 * A trial that already has a paid subscription behind it (subscribed mid-trial) is left to the
 * provider, which moves it to active (or past_due) when billing starts.
 */
export function effectiveStatus(sub: SubState): Subscription["status"] {
  const ended = sub.status === "trialing" && !!sub.trialEndsAt && sub.trialEndsAt.getTime() <= Date.now();
  return ended && !sub.providerSubscriptionId ? "expired" : sub.status;
}

/** Subscribed during the trial: paid plan chosen, billing starts when the trial ends. */
export const subscribedInTrial = (sub: SubState) => sub.status === "trialing" && !!sub.providerSubscriptionId;

/** Days left in a running trial, counting the current day (a new 14-day trial shows 14), or null. */
export function trialDaysLeft(sub: SubState) {
  if (effectiveStatus(sub) !== "trialing" || !sub.trialEndsAt) return null;
  return Math.max(1, Math.ceil((sub.trialEndsAt.getTime() - Date.now()) / 86_400_000));
}

/** Records trials that ended without a subscription (run daily by /api/cron/cleanup). */
export async function expireTrials() {
  return db
    .update(subscriptions)
    .set({ status: "expired", updatedAt: new Date() })
    .where(
      and(eq(subscriptions.status, "trialing"), lt(subscriptions.trialEndsAt, new Date()), isNull(subscriptions.providerSubscriptionId)),
    )
    .returning({ orgId: subscriptions.orgId });
}

/**
 * Can this tenant use its workspace? Single-agency deployments, the demo tenant and tenants
 * without a subscription row (created before billing existed) are never locked.
 * A failed renewal (past_due) keeps access while the provider retries.
 */
export function hasAccess(org: Pick<Organization, "isDemo">, sub: Subscription | null | undefined) {
  if (!isPlatform() || org.isDemo || !sub) return true;
  const status = effectiveStatus(sub);
  return status === "active" || status === "past_due" || status === "trialing";
}

/**
 * Applies a billing event exactly once. Events without a known tenant are recorded and ignored.
 * Returns false when the event was already processed.
 */
export async function applyBillingEvent(evt: BillingEvent): Promise<boolean> {
  return db.transaction(async (tx) => {
    const [recorded] = await tx
      .insert(billingEvents)
      .values({ provider: evt.provider, eventId: evt.eventId, type: evt.type, orgId: evt.orgId, payload: evt.raw as object })
      .onConflictDoNothing()
      .returning({ id: billingEvents.id });
    if (!recorded) return false;
    if (!evt.orgId) return true;

    const existing = await tx.query.subscriptions.findFirst({ where: eq(subscriptions.orgId, evt.orgId) });
    if (!existing) return true;
    // Ignore stale events for a subscription that has since been replaced.
    if (existing.providerSubscriptionId && evt.subscriptionId && existing.providerSubscriptionId !== evt.subscriptionId && evt.type !== "checkout.session.completed") {
      return true;
    }
    await tx
      .update(subscriptions)
      .set({
        provider: evt.provider,
        ...(evt.status ? { status: evt.status } : {}),
        ...(evt.customerId ? { providerCustomerId: evt.customerId } : {}),
        ...(evt.subscriptionId ? { providerSubscriptionId: evt.subscriptionId } : {}),
        ...(evt.currentPeriodEnd !== undefined ? { currentPeriodEnd: evt.currentPeriodEnd } : {}),
        ...(evt.cancelAtPeriodEnd !== undefined ? { cancelAtPeriodEnd: evt.cancelAtPeriodEnd } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(subscriptions.orgId, evt.orgId)));
    return true;
  });
}
