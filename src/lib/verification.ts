import "server-only";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { accounts, emailVerifications, type Organization } from "@/db/schema";
import { hashToken, newToken } from "./auth";
import { orgBrand } from "./brand";
import { emailEnabled, notificationEmail, sendEmail } from "./email";
import { getSaasT } from "./i18n-saas";
import { tenantBaseUrl } from "./platform";

/**
 * Email verification. A person proves they own their address by opening a single-use link
 * (valid 48 hours). Nothing is blocked while unverified; the status is stored on the account
 * (`accounts.email_verified_at`) so features can require it later.
 *
 * Delivery goes through lib/email.ts (Resend or SMTP). Without a configured provider nothing is
 * sent and nothing pretends to be: callers get `{ sent: false, reason: "not_configured" }`.
 */
export const VERIFY_HOURS = 48;

export type VerificationResult = { sent: true } | { sent: false; reason: "not_configured" | "already_verified" | "failed" };

/** Creates a fresh link for the account's current email (older unused links stop working). */
export async function issueVerification(account: { id: string; email: string }) {
  const token = newToken();
  await db.transaction(async (tx) => {
    await tx
      .update(emailVerifications)
      .set({ usedAt: new Date() })
      .where(and(eq(emailVerifications.accountId, account.id), isNull(emailVerifications.usedAt)));
    await tx.insert(emailVerifications).values({
      accountId: account.id,
      email: account.email,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + VERIFY_HOURS * 3600_000),
    });
  });
  return token;
}

/** Sends the verification email for an account, branded by (and linking to) the given agency. */
export async function sendVerification(accountId: string, org: Organization, lang: "ar" | "en"): Promise<VerificationResult> {
  const account = await db.query.accounts.findFirst({ where: eq(accounts.id, accountId) });
  if (!account) return { sent: false, reason: "failed" };
  if (account.emailVerifiedAt) return { sent: false, reason: "already_verified" };
  if (!emailEnabled()) return { sent: false, reason: "not_configured" };
  const token = await issueVerification(account);
  const v = (await getSaasT(lang)).t.verify;
  try {
    await sendEmail({
      to: account.email,
      ...notificationEmail({
        lang,
        title: v.emailTitle,
        body: v.emailBody(account.email),
        link: `/verify-email?token=${encodeURIComponent(token)}`,
        brand: orgBrand(org),
        baseUrl: tenantBaseUrl(org),
        cta: v.emailCta,
        footer: v.emailFooter(VERIFY_HOURS),
      }),
    });
    return { sent: true };
  } catch (err) {
    console.error("[verification email failed]", err);
    return { sent: false, reason: "failed" };
  }
}

/**
 * Redeems a link exactly once. The account is verified only if its email is still the address the
 * link was sent to (an email change in between invalidates it).
 */
export async function confirmVerification(token: string): Promise<boolean> {
  if (!token || token.length > 100) return false;
  const [row] = await db
    .update(emailVerifications)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(emailVerifications.tokenHash, hashToken(token)),
        isNull(emailVerifications.usedAt),
        gt(emailVerifications.expiresAt, new Date()),
      ),
    )
    .returning({ accountId: emailVerifications.accountId, email: emailVerifications.email });
  if (!row) return false;
  const [verified] = await db
    .update(accounts)
    .set({ emailVerifiedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(accounts.id, row.accountId), eq(accounts.email, row.email)))
    .returning({ id: accounts.id });
  return !!verified;
}
