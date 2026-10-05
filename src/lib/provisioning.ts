import "server-only";
import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  accounts,
  moduleTemplates,
  organizations,
  plans,
  provisionings,
  signups,
  subscriptions,
  userOnboarding,
  users,
  type Signup,
} from "@/db/schema";
import { DEFAULT_TRIAL_DAYS } from "./billing/defaults";
import { DEFAULT_TEMPLATES } from "./default-templates";
import { RESERVED_SLUGS, SLUG_RE } from "./platform";

export class ProvisioningError extends Error {
  constructor(public code: "slugTaken" | "emailTaken" | "incomplete") {
    super(code);
  }
}

export type ProvisionResult = { orgId: string; serial: string; slug: string; adminId: string };

/** Is this workspace address free (not reserved, not used by another tenant)? */
export async function slugAvailable(slug: string, exceptOrgId?: string | null) {
  if (!SLUG_RE.test(slug) || RESERVED_SLUGS.has(slug)) return false;
  const taken = await db.query.organizations.findFirst({
    where: exceptOrgId ? and(eq(organizations.slug, slug), ne(organizations.id, exceptOrgId)) : eq(organizations.slug, slug),
  });
  return !taken;
}

/**
 * Creates the tenant for a completed signup. Idempotent and safe to retry:
 * - the provisioning row is unique per signup and locked (FOR UPDATE) for the whole run;
 * - every step checks what already exists before inserting;
 * - it all runs in one transaction, so a failure leaves nothing half-made.
 * The instance serial (OPR-000123) is assigned by the database when the organization is inserted.
 */
export async function provisionSignup(signupId: string): Promise<ProvisionResult> {
  await db.insert(provisionings).values({ signupId }).onConflictDoNothing();

  try {
    return await db.transaction(async (tx) => {
      const [prov] = await tx.select().from(provisionings).where(eq(provisionings.signupId, signupId)).for("update");
      const [signup] = await tx.select().from(signups).where(eq(signups.id, signupId)).for("update");
      if (!signup || !signup.companyName || !signup.slug) throw new ProvisioningError("incomplete");

      await tx
        .update(provisionings)
        .set({ status: "running", attempts: sql`${provisionings.attempts} + 1`, startedAt: prov.startedAt ?? new Date(), error: null })
        .where(eq(provisionings.id, prov.id));

      // 1–2. Company + instance serial.
      let org = prov.orgId ? await tx.query.organizations.findFirst({ where: eq(organizations.id, prov.orgId) }) : undefined;
      if (!org) {
        const clash = await tx.query.organizations.findFirst({ where: eq(organizations.slug, signup.slug) });
        if (clash || RESERVED_SLUGS.has(signup.slug)) throw new ProvisioningError("slugTaken");
        [org] = await tx
          .insert(organizations)
          .values({
            name: signup.companyName,
            nameAr: signup.companyNameAr,
            slug: signup.slug,
            status: "provisioning",
            // 4. Branding.
            logo: signup.logo,
            primaryColor: signup.primaryColor ?? "#1F3FBF",
            accentColor: signup.accentColor ?? "#e3e8fc",
            defaultLang: signup.defaultLang === "ar" ? "ar" : "en",
            contactEmail: signup.email,
          })
          .returning();
        await tx.update(provisionings).set({ orgId: org.id, step: "company" }).where(eq(provisionings.id, prov.id));
        await tx.update(signups).set({ orgId: org.id, updatedAt: new Date() }).where(eq(signups.id, signup.id));
      }

      // 3. The admin: their person account — new, or an existing Operra account whose password was
      //    proven at sign-up (the sign-up then carries that account's hash) — and a membership here.
      let account = await tx.query.accounts.findFirst({ where: eq(accounts.email, signup.email) });
      if (!account) [account] = await tx.insert(accounts).values({ email: signup.email, passwordHash: signup.passwordHash }).returning();
      else if (account.passwordHash !== signup.passwordHash) throw new ProvisioningError("emailTaken");
      let admin = await tx.query.users.findFirst({ where: and(eq(users.orgId, org.id), eq(users.accountId, account.id)) });
      if (!admin) {
        [admin] = await tx
          .insert(users)
          .values({
            orgId: org.id,
            accountId: account.id,
            name: signup.name,
            email: account.email,
            role: "admin",
            title: null,
            lang: signup.lang === "ar" ? "ar" : "en",
          })
          .returning();
      }

      // 5–6. Default workspace configuration: starter module templates.
      const [{ n }] = await tx
        .select({ n: sql<number>`count(*)::int` })
        .from(moduleTemplates)
        .where(eq(moduleTemplates.orgId, org.id));
      if (n === 0) await tx.insert(moduleTemplates).values(DEFAULT_TEMPLATES.map((t) => ({ ...t, orgId: org.id })));

      // Subscription: starts on the plan's trial; payment (if chosen) upgrades it via the provider.
      const plan = await tx.query.plans.findFirst({ where: eq(plans.code, signup.planCode) });
      await tx
        .insert(subscriptions)
        .values({
          orgId: org.id,
          planCode: signup.planCode,
          status: "trialing",
          trialEndsAt: new Date(Date.now() + (plan?.trialDays ?? DEFAULT_TRIAL_DAYS) * 86_400_000),
        })
        .onConflictDoNothing();

      // 7. Onboarding state: the admin's tutorial.
      await tx.insert(userOnboarding).values({ userId: admin.id, orgId: org.id, flow: "admin" }).onConflictDoNothing();

      // 10. Done.
      await tx.update(organizations).set({ status: "active", updatedAt: new Date() }).where(eq(organizations.id, org.id));
      await tx
        .update(provisionings)
        .set({ status: "completed", step: "completed", completedAt: prov.completedAt ?? new Date() })
        .where(eq(provisionings.id, prov.id));

      return { orgId: org.id, serial: org.serial, slug: org.slug, adminId: admin.id };
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db
      .update(provisionings)
      .set({ status: "failed", error: message.slice(0, 500) })
      .where(eq(provisionings.signupId, signupId));
    console.error("[provisioning failed]", { signupId, message });
    throw err;
  }
}

export const provisioningFor = (signupId: string) => db.query.provisionings.findFirst({ where: eq(provisionings.signupId, signupId) });

export type { Signup };
