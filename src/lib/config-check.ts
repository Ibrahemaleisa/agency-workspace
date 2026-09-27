import "server-only";
import { appUrl, isPlatform, rootDomain } from "./platform";
import { emailEnabled } from "./email";
import { providerName } from "./billing";

export type ConfigCheck = { key: string; ok: boolean | null; note: string };

/**
 * What this deployment is configured with — names only, never values. `ok: null` = optional and
 * not set. Shown to Operra staff in the control center so a deploy can be verified honestly.
 */
export function configChecks(): ConfigCheck[] {
  const prod = process.env.NODE_ENV === "production";
  const billing = providerName();
  const stripeReady = !!process.env.STRIPE_SECRET_KEY && !!process.env.STRIPE_WEBHOOK_SECRET;
  const lsReady = !!process.env.LEMONSQUEEZY_API_KEY && !!process.env.LEMONSQUEEZY_STORE_ID && !!process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  return [
    { key: "OPERRA_PLATFORM", ok: isPlatform(), note: isPlatform() ? "Platform mode" : "Single-agency mode" },
    {
      key: "APP_URL",
      ok: !!process.env.APP_URL || !!process.env.VERCEL_PROJECT_PRODUCTION_URL,
      note: appUrl(),
    },
    {
      key: "APP_SECRET",
      ok: (process.env.APP_SECRET?.length ?? 0) >= 32,
      note: (process.env.APP_SECRET?.length ?? 0) >= 32 ? "Set" : prod ? "Missing — required in production" : "Using the development fallback",
    },
    { key: "APP_ROOT_DOMAIN", ok: rootDomain() ? true : null, note: rootDomain() ? `Tenants at {slug}.${rootDomain()}` : "Not set — path routing (/w/{slug})" },
    { key: "CRON_SECRET", ok: !!process.env.CRON_SECRET, note: process.env.CRON_SECRET ? "Set" : "Missing — daily cleanup and trial expiry won't run" },
    {
      key: "Email (RESEND_API_KEY or SMTP_HOST)",
      ok: emailEnabled() ? true : null,
      note: emailEnabled() ? "Configured" : "Not configured — invitations show a copy link; verification and reset emails can't be sent",
    },
    {
      key: "Billing provider",
      ok: billing === "stripe" ? stripeReady : billing === "lemonsqueezy" ? lsReady : billing === "test" ? !prod || process.env.ALLOW_TEST_BILLING === "true" : null,
      note:
        billing === "lemonsqueezy"
          ? lsReady
            ? `Lemon Squeezy — cards, Apple Pay, Google Pay, PayPal${process.env.LEMONSQUEEZY_TEST_MODE === "true" ? " (TEST MODE)" : ""}`
            : "Lemon Squeezy selected but LEMONSQUEEZY_WEBHOOK_SECRET missing"
          : billing === "stripe"
          ? stripeReady
            ? "Stripe (secret key and webhook secret set)"
            : "Stripe selected but STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET missing"
          : billing === "test"
            ? "TEST provider — never use for real customers"
            : "None — no card payment yet: subscribing uses plan requests (and bank transfer if set in Payments)",
    },
    {
      key: "Storage (BLOB_READ_WRITE_TOKEN)",
      ok: process.env.BLOB_READ_WRITE_TOKEN ? true : null,
      note: process.env.BLOB_READ_WRITE_TOKEN ? "Vercel Blob (private)" : process.env.VERCEL ? "Postgres (4 MB per file)" : "Local disk (UPLOAD_DIR)",
    },
  ];
}
