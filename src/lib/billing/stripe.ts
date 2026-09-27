import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Plan } from "@/db/schema";
import type { BillingEvent, BillingProvider } from "./types";

/*
 * Stripe over its REST API (no SDK dependency). Needs:
 *   STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET. Each plan is charged its price from the control center
 *   (currency, amount, month/year), or a Stripe Price if one is set (plans.stripe_price_id / STRIPE_PRICE_<PLAN>).
 * Stripe is the source of truth; our subscriptions table mirrors it through webhooks.
 */
const API = "https://api.stripe.com/v1";

async function stripe<T>(path: string, method: "GET" | "POST", params?: Record<string, string>): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params ? new URLSearchParams(params).toString() : undefined,
  });
  const json = (await res.json()) as T & { error?: { message: string } };
  if (!res.ok) throw new Error(`Stripe ${res.status}: ${json.error?.message ?? "request failed"}`);
  return json;
}

/** The Stripe Price for a plan: the plan's own `stripe_price_id`, else STRIPE_PRICE_<CODE>. */
export const priceFor = (plan: Pick<Plan, "code" | "stripePriceId">) =>
  plan.stripePriceId || process.env[`STRIPE_PRICE_${plan.code.toUpperCase()}`] || null;

/** Stripe Checkout requires a trial end at least 48 hours ahead; shorter remainders start billing now. */
const MIN_TRIAL_END_MS = 48 * 3600_000 + 5 * 60_000;

export const stripeProvider: BillingProvider = {
  name: "stripe",
  async createCheckout({ org, plan, email, successUrl, cancelUrl, trialEndsAt }) {
    // A Stripe Price if one is set for the plan; otherwise the plan's own price from the control center.
    const price = priceFor(plan);
    if (!price && plan.priceCents == null) {
      throw new Error(`Plan "${plan.code}" has no price: set a display price (or a Stripe price ID) in the control center.`);
    }
    const line: Record<string, string> = price
      ? { "line_items[0][price]": price }
      : {
          "line_items[0][price_data][currency]": plan.currency.toLowerCase(),
          "line_items[0][price_data][unit_amount]": String(plan.priceCents),
          "line_items[0][price_data][recurring][interval]": plan.interval === "year" ? "year" : "month",
          "line_items[0][price_data][product_data][name]": `Operra — ${plan.name}`,
          "line_items[0][price_data][product_data][metadata][plan]": plan.code,
        };
    const keepTrial = trialEndsAt && trialEndsAt.getTime() - Date.now() > MIN_TRIAL_END_MS;
    const session = await stripe<{ url: string }>("/checkout/sessions", "POST", {
      mode: "subscription",
      ...line,
      "line_items[0][quantity]": "1",
      "metadata[plan]": plan.code,
      "subscription_data[metadata][plan]": plan.code,
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: org.id,
      customer_email: email,
      "metadata[org_id]": org.id,
      "metadata[serial]": org.serial,
      "subscription_data[metadata][org_id]": org.id,
      "subscription_data[metadata][serial]": org.serial,
      allow_promotion_codes: "true",
      ...(keepTrial ? { "subscription_data[trial_end]": String(Math.floor(trialEndsAt.getTime() / 1000)) } : {}),
    });
    return session.url;
  },
  async portalUrl({ customerId, returnUrl }) {
    const session = await stripe<{ url: string }>("/billing_portal/sessions", "POST", { customer: customerId, return_url: returnUrl });
    return session.url;
  },
};

/** Verifies the Stripe-Signature header (HMAC-SHA256 over "timestamp.payload", 5-minute tolerance). */
export function verifyStripeSignature(payload: string, header: string | null) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !header) return false;
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=") as [string, string]));
  const t = Number(parts.t);
  const signatures = header.split(",").filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  if (!t || Math.abs(Date.now() / 1000 - t) > 300 || signatures.length === 0) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${payload}`).digest();
  return signatures.some((sig) => {
    const given = Buffer.from(sig, "hex");
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}

type StripeSub = {
  id: string;
  status: BillingEvent["status"];
  customer: string;
  cancel_at_period_end: boolean;
  current_period_end?: number;
  items?: { data?: { current_period_end?: number }[] };
  metadata?: { org_id?: string; plan?: string };
};

const periodEnd = (s: StripeSub) => {
  const ts = s.current_period_end ?? s.items?.data?.[0]?.current_period_end;
  return ts ? new Date(ts * 1000) : null;
};

/** Turns a verified Stripe event into zero or one normalised billing events. */
export async function normalizeStripeEvent(event: {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
}): Promise<BillingEvent | null> {
  const obj = event.data.object;
  if (event.type === "checkout.session.completed") {
    const subId = obj.subscription as string | null;
    const orgId = (obj.metadata as { org_id?: string } | undefined)?.org_id ?? (obj.client_reference_id as string | null);
    if (!subId) return null;
    const sub = await stripe<StripeSub>(`/subscriptions/${subId}`, "GET");
    return {
      provider: "stripe",
      eventId: event.id,
      type: event.type,
      orgId: orgId ?? sub.metadata?.org_id ?? null,
      customerId: sub.customer,
      subscriptionId: sub.id,
      status: sub.status,
      currentPeriodEnd: periodEnd(sub),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      raw: event,
    };
  }
  if (event.type === "invoice.paid") {
    // A successful charge (first payment and every renewal). Zero-amount invoices (trial starts) are skipped later.
    const inv = obj as {
      id: string;
      amount_paid: number;
      currency: string;
      customer: string;
      hosted_invoice_url?: string | null;
      subscription?: string | null;
      parent?: { subscription_details?: { subscription?: string } } | null;
      lines?: { data?: { period?: { start: number; end: number } }[] };
    };
    const subId = inv.subscription ?? inv.parent?.subscription_details?.subscription ?? null;
    if (!subId) return null;
    const sub = await stripe<StripeSub>(`/subscriptions/${subId}`, "GET");
    const period = inv.lines?.data?.[0]?.period;
    return {
      provider: "stripe",
      eventId: event.id,
      type: event.type,
      orgId: sub.metadata?.org_id ?? null,
      customerId: sub.customer,
      subscriptionId: sub.id,
      status: sub.status,
      currentPeriodEnd: periodEnd(sub),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      invoice: {
        providerInvoiceId: inv.id,
        amountCents: inv.amount_paid,
        currency: inv.currency,
        planCode: sub.metadata?.plan ?? null,
        periodStart: period ? new Date(period.start * 1000) : null,
        periodEnd: period ? new Date(period.end * 1000) : null,
        url: inv.hosted_invoice_url ?? null,
      },
      raw: event,
    };
  }
  if (event.type.startsWith("customer.subscription.")) {
    const sub = obj as unknown as StripeSub;
    return {
      provider: "stripe",
      eventId: event.id,
      type: event.type,
      orgId: sub.metadata?.org_id ?? null,
      customerId: sub.customer,
      subscriptionId: sub.id,
      status: event.type === "customer.subscription.deleted" ? "canceled" : sub.status,
      currentPeriodEnd: periodEnd(sub),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      raw: event,
    };
  }
  return null;
}
