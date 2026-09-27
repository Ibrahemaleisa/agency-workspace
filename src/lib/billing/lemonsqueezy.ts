import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Plan } from "@/db/schema";
import type { BillingEvent, BillingProvider } from "./types";

/*
 * Lemon Squeezy (merchant of record: it sells on Operra's behalf, handles tax and receipts, and
 * accepts cards, Apple Pay, Google Pay and PayPal — no company needed to open an account).
 * Needs LEMONSQUEEZY_API_KEY, LEMONSQUEEZY_STORE_ID, LEMONSQUEEZY_WEBHOOK_SECRET, and for each plan a
 * subscription product variant: the plan's "provider price ID" in the control center, or
 * LEMONSQUEEZY_VARIANT_<PLAN> (e.g. LEMONSQUEEZY_VARIANT_STANDARD).
 * Lemon Squeezy is the source of truth; our subscriptions table mirrors it through webhooks.
 */
const API = "https://api.lemonsqueezy.com/v1";

async function ls<T>(path: string, init?: { method?: "GET" | "POST"; body?: unknown }): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });
  const json = (await res.json().catch(() => ({}))) as T & { errors?: { detail?: string }[] };
  if (!res.ok) throw new Error(`Lemon Squeezy ${res.status}: ${json.errors?.[0]?.detail ?? "request failed"}`);
  return json;
}

/** The Lemon Squeezy variant for a plan: its provider price ID, else LEMONSQUEEZY_VARIANT_<CODE>. */
export const variantFor = (plan: Pick<Plan, "code" | "stripePriceId">) =>
  (plan.stripePriceId && /^\d+$/.test(plan.stripePriceId) ? plan.stripePriceId : null) ||
  process.env[`LEMONSQUEEZY_VARIANT_${plan.code.toUpperCase()}`] ||
  null;

export const lemonSqueezyProvider: BillingProvider = {
  name: "lemonsqueezy",
  async createCheckout({ org, plan, email, successUrl }) {
    const variant = variantFor(plan);
    if (!variant) throw new Error(`No Lemon Squeezy variant for plan "${plan.code}" (control center → Plans, or LEMONSQUEEZY_VARIANT_${plan.code.toUpperCase()}).`);
    const res = await ls<{ data: { attributes: { url: string } } }>("/checkouts", {
      method: "POST",
      body: {
        data: {
          type: "checkouts",
          attributes: {
            checkout_data: { email, custom: { org_id: org.id, serial: org.serial, plan: plan.code } },
            product_options: { redirect_url: successUrl, enabled_variants: [Number(variant)] },
            checkout_options: { embed: false },
            test_mode: process.env.LEMONSQUEEZY_TEST_MODE === "true",
          },
          relationships: {
            store: { data: { type: "stores", id: String(process.env.LEMONSQUEEZY_STORE_ID) } },
            variant: { data: { type: "variants", id: String(variant) } },
          },
        },
      },
    });
    return res.data.attributes.url;
  },
  async portalUrl({ subscriptionId }) {
    if (!subscriptionId) return null;
    const res = await ls<{ data: { attributes: { urls?: { customer_portal?: string } } } }>(`/subscriptions/${subscriptionId}`);
    return res.data.attributes.urls?.customer_portal ?? null;
  },
};

/** Verifies the X-Signature header: hex HMAC-SHA256 of the raw body with the webhook signing secret. */
export function verifyLemonSqueezySignature(payload: string, header: string | null) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret || !header || !/^[0-9a-f]+$/i.test(header)) return false;
  const expected = createHmac("sha256", secret).update(payload).digest();
  const given = Buffer.from(header, "hex");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

type LsSubscription = {
  status: string;
  customer_id: number;
  renews_at: string | null;
  ends_at: string | null;
  cancelled: boolean;
  updated_at: string;
};
type LsInvoice = {
  subscription_id: number;
  customer_id: number;
  total: number;
  currency: string;
  status: string;
  updated_at: string;
  urls?: { invoice_url?: string | null };
};

const date = (v: string | null | undefined) => (v ? new Date(v) : null);

/**
 * Lemon Squeezy status → ours. "cancelled" there means cancelled but paid until ends_at, so it stays
 * active here with cancel-at-period-end; "expired" is the actual end.
 */
function mapStatus(s: LsSubscription): Pick<BillingEvent, "status" | "cancelAtPeriodEnd" | "currentPeriodEnd"> {
  switch (s.status) {
    case "on_trial":
      return { status: "trialing", cancelAtPeriodEnd: false, currentPeriodEnd: date(s.renews_at) };
    case "active":
      return { status: "active", cancelAtPeriodEnd: false, currentPeriodEnd: date(s.renews_at) };
    case "cancelled":
      return { status: "active", cancelAtPeriodEnd: true, currentPeriodEnd: date(s.ends_at) };
    case "past_due":
    case "paused":
      return { status: "past_due", cancelAtPeriodEnd: false, currentPeriodEnd: date(s.renews_at) };
    case "unpaid":
      return { status: "unpaid", cancelAtPeriodEnd: false, currentPeriodEnd: date(s.renews_at) };
    case "expired":
    default:
      return { status: "canceled", cancelAtPeriodEnd: false, currentPeriodEnd: date(s.ends_at) };
  }
}

/** Turns a verified Lemon Squeezy webhook into zero or one normalised billing events. */
export function normalizeLemonSqueezyEvent(event: {
  meta: { event_name: string; custom_data?: { org_id?: string; plan?: string } };
  data: { id: string; type: string; attributes: Record<string, unknown> };
}): BillingEvent | null {
  const name = event.meta.event_name;
  const orgId = event.meta.custom_data?.org_id ?? null;
  const attrs = event.data.attributes;
  if (event.data.type === "subscriptions" && name.startsWith("subscription_")) {
    const s = attrs as unknown as LsSubscription;
    return {
      provider: "lemonsqueezy",
      // Lemon Squeezy has no event id: the subscription's own update time makes each change unique.
      eventId: `${name}:${event.data.id}:${s.updated_at}`,
      type: name,
      orgId,
      customerId: String(s.customer_id),
      subscriptionId: String(event.data.id),
      ...mapStatus(s),
      raw: event,
    };
  }
  if (event.data.type === "subscription-invoices" && name === "subscription_payment_success") {
    const inv = attrs as unknown as LsInvoice;
    if (inv.status !== "paid") return null;
    return {
      provider: "lemonsqueezy",
      eventId: `${name}:${event.data.id}`,
      type: name,
      orgId,
      customerId: String(inv.customer_id),
      subscriptionId: String(inv.subscription_id),
      status: "active",
      invoice: {
        providerInvoiceId: `ls_${event.data.id}`,
        amountCents: inv.total,
        currency: inv.currency,
        planCode: event.meta.custom_data?.plan ?? null,
        url: inv.urls?.invoice_url ?? null,
      },
      raw: event,
    };
  }
  return null;
}
