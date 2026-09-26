import type { Organization } from "@/db/schema";

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
  raw: unknown;
};

export interface BillingProvider {
  name: ProviderName;
  /** Where to send the admin to pay. */
  createCheckout(input: { org: Organization; planCode: string; email: string; successUrl: string; cancelUrl: string }): Promise<string>;
  /** Self-service billing (payment method, invoices, cancel). Null when the provider has none. */
  portalUrl(input: { customerId: string; returnUrl: string }): Promise<string | null>;
}
