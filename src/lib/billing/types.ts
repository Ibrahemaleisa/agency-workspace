import type { Organization, Plan } from "@/db/schema";

export type ProviderName = "stripe" | "lemonsqueezy" | "test";

/** A billing change, normalised from any provider. Applied idempotently by applyBillingEvent. */
export type BillingEvent = {
  provider: ProviderName;
  eventId: string;
  type: string;
  orgId: string | null;
  customerId?: string | null;
  subscriptionId?: string | null;
  status?: "trialing" | "active" | "past_due" | "canceled" | "incomplete" | "unpaid";
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
  /**
   * What the provider says is being paid for now: a Stripe Price id, a Lemon Squeezy variant id, or
   * the plan code from our own metadata (least reliable: it isn't updated when the customer switches
   * plan in the provider's portal). Resolved to one of our plans by applyBillingEvent.
   */
  planRef?: { priceId?: string | null; variantId?: string | null; code?: string | null };
  /** A successful payment: recorded once as an invoice and emailed to the agency's admins. */
  invoice?: {
    providerInvoiceId: string;
    amountCents: number;
    currency: string;
    planCode?: string | null;
    periodStart?: Date | null;
    periodEnd?: Date | null;
    url?: string | null;
  };
  raw: unknown;
};

export interface BillingProvider {
  name: ProviderName;
  /** Where to send the admin to pay. */
  createCheckout(input: {
    org: Organization;
    plan: Plan;
    email: string;
    successUrl: string;
    cancelUrl: string;
    /** End of a running free trial: the paid subscription starts then, so no trial days are lost. */
    trialEndsAt?: Date | null;
  }): Promise<string>;
  /** Self-service billing (payment method, invoices, cancel). Null when the provider has none. */
  portalUrl(input: { customerId: string; subscriptionId?: string | null; returnUrl: string }): Promise<string | null>;
}
