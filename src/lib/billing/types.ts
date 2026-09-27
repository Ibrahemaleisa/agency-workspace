import type { Organization, Plan } from "@/db/schema";

export type ProviderName = "stripe" | "test";

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
  portalUrl(input: { customerId: string; returnUrl: string }): Promise<string | null>;
}
