import "server-only";
import { and, eq, gt, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { accounts, passwordResets, sessions, users } from "@/db/schema";
import { OPERRA_BRAND, orgBrand } from "./brand";
import { hashPassword, hashToken, newToken } from "./auth";
import { emailEnabled, notificationEmail, sendEmail } from "./email";
import { getSaasT } from "./i18n-saas";
import { appUrl, tenantBaseUrl } from "./platform";
import { getPublicTenant } from "./tenant";

/**
 * Self-service password reset, for the person's one password across all their agencies.
 * The request never reveals whether an account exists. The emailed link is built from a known
 * host — this agency's own address or APP_URL — never from the request's Host header, so a
 * forged host can't redirect someone's reset link (reset poisoning).
 */
export const RESET_MINUTES = 60;

export async function requestPasswordReset(email: string, lang: "ar" | "en") {
  const account = await db.query.accounts.findFirst({ where: eq(accounts.email, email.trim().toLowerCase()) });
  if (!account || !emailEnabled()) return;
  const token = newToken();
  await db.transaction(async (tx) => {
    await tx.update(passwordResets).set({ usedAt: new Date() }).where(and(eq(passwordResets.accountId, account.id), isNull(passwordResets.usedAt)));
    await tx.insert(passwordResets).values({
      accountId: account.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + RESET_MINUTES * 60_000),
    });
  });
  // The agency whose sign-in page this is (tenant host, /w/ hint, or the single agency) — URLs from config only.
  const tenant = await getPublicTenant();
  const r = (await getSaasT(lang)).t.reset;
  try {
    await sendEmail({
      to: account.email,
      ...notificationEmail({
        lang,
        title: r.emailTitle,
        body: r.emailBody,
        link: `/reset-password?token=${encodeURIComponent(token)}`,
        brand: tenant ? orgBrand(tenant) : OPERRA_BRAND,
        baseUrl: tenant ? tenantBaseUrl(tenant) : appUrl(),
        cta: r.emailCta,
        footer: r.emailFooter(RESET_MINUTES),
      }),
    });
  } catch (err) {
    console.error("[password reset email failed]", err);
  }
}

/**
 * Sets a new password from a reset link, once. The link came by email, so it also confirms the
 * address; every session of the person, in every agency, is signed out.
 */
export async function resetPassword(token: string, password: string): Promise<boolean> {
  if (!token || token.length > 100) return false;
  const passwordHash = await hashPassword(password);
  return db.transaction(async (tx) => {
    const [row] = await tx
      .update(passwordResets)
      .set({ usedAt: new Date() })
      .where(and(eq(passwordResets.tokenHash, hashToken(token)), isNull(passwordResets.usedAt), gt(passwordResets.expiresAt, new Date())))
      .returning({ accountId: passwordResets.accountId });
    if (!row) return false;
    await tx
      .update(accounts)
      .set({ passwordHash, emailVerifiedAt: sql`coalesce(${accounts.emailVerifiedAt}, now())`, updatedAt: new Date() })
      .where(eq(accounts.id, row.accountId));
    const memberships = tx.select({ id: users.id }).from(users).where(eq(users.accountId, row.accountId));
    await tx.delete(sessions).where(inArray(sessions.userId, memberships));
    return true;
  });
}
