import "server-only";
import { randomUUID } from "node:crypto";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { invoices, organizations, planRequests, platformAdmins, plans, subscriptions } from "@/db/schema";
import { OPERRA_BRAND } from "../brand";
import { emailEnabled, notificationEmail, sendEmail } from "../email";
import { appUrl } from "../platform";
import { track } from "../analytics";
import { effectiveStatus } from "./index";
import { sendInvoiceEmail } from "./invoice-email";

/*
 * Manual billing: selling without a connected payment provider.
 * The agency picks a plan ("request"), keeps working meanwhile (a short grace period if its trial
 * has ended or is about to), and Operra staff activate the plan from the control center once paid —
 * which records an invoice, emails it, and opens the workspace for the paid months.
 */
export const GRACE_DAYS = 3;
const DAY = 86_400_000;

export async function pendingRequest(orgId: string) {
  return db.query.planRequests.findFirst({
    where: and(eq(planRequests.orgId, orgId), eq(planRequests.status, "pending")),
    orderBy: desc(planRequests.createdAt),
  });
}

/** The agency asks for a plan. Idempotent: a second request just changes the plan asked for. */
export async function requestPlan(orgId: string, planCode: string, requestedById: string | null) {
  const plan = await db.query.plans.findFirst({ where: and(eq(plans.code, planCode), eq(plans.active, true)) });
  const org = await db.query.organizations.findFirst({ where: eq(organizations.id, orgId) });
  if (!plan || !org || org.isDemo) return null;
  const existing = await pendingRequest(orgId);
  const sub = await db.query.subscriptions.findFirst({ where: eq(subscriptions.orgId, orgId) });

  await db.transaction(async (tx) => {
    if (existing) {
      await tx.update(planRequests).set({ planCode, requestedById }).where(eq(planRequests.id, existing.id));
    } else {
      await tx.insert(planRequests).values({ orgId, planCode, requestedById });
    }
    if (sub && !sub.providerSubscriptionId && sub.status !== "active") {
      // The trial continues on the chosen plan; a trial that has ended (or ends within the grace
      // period) gets a few days so the agency is never locked out while staff activate the plan.
      // Only the first request earns grace.
      const graceUntil = new Date(Date.now() + GRACE_DAYS * DAY);
      const needsGrace = !existing && (!sub.trialEndsAt || sub.trialEndsAt < graceUntil);
      await tx
        .update(subscriptions)
        .set({
          planCode,
          ...(needsGrace ? { status: "trialing", trialEndsAt: graceUntil } : {}),
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.orgId, orgId));
    }
  });
  await track("signup_step", { orgId, meta: { step: "plan_request", plan: planCode } });
  if (!existing) await notifyStaff(org.name, org.serial, plan.name);
  return pendingRequest(orgId);
}

/** Emails Operra staff that an agency wants to subscribe (when email is configured). */
async function notifyStaff(orgName: string, serial: string, planName: string) {
  if (!emailEnabled()) return;
  const staff = await db.query.platformAdmins.findMany({ where: eq(platformAdmins.active, true), columns: { email: true } });
  for (const s of staff) {
    try {
      await sendEmail({
        to: s.email,
        ...notificationEmail({
          lang: "en",
          title: `${orgName} wants the ${planName} plan`,
          body: `Workspace ${serial} asked to subscribe to ${planName}. Activate it from the control center once paid.`,
          link: "/operra",
          brand: OPERRA_BRAND,
          baseUrl: appUrl(),
          cta: "Open the control center",
          footer: "Operra control center",
        }),
      });
    } catch (err) {
      console.error("[plan request email failed]", err);
    }
  }
}

/**
 * Staff activate a plan for N months (after payment). Extends an active manual plan from its current
 * end; otherwise starts now. Records and emails an invoice for the amount received.
 */
export async function activatePlan(input: { orgId: string; planCode: string; months: number; amountCents: number | null; staffEmail: string }) {
  const plan = await db.query.plans.findFirst({ where: eq(plans.code, input.planCode) });
  const sub = await db.query.subscriptions.findFirst({ where: eq(subscriptions.orgId, input.orgId) });
  if (!plan || !sub) return { error: "Unknown plan or workspace." };
  if (sub.providerSubscriptionId) return { error: "This workspace pays online; change its plan with the payment provider." };
  const months = Math.min(24, Math.max(1, Math.round(input.months)));
  const amountCents = input.amountCents ?? (plan.priceCents != null ? plan.priceCents * months : null);
  if (amountCents == null) return { error: "Enter the amount received (this plan has no price)." };

  const now = new Date();
  const stillActive = sub.provider === "manual" && effectiveStatus(sub) === "active" && sub.currentPeriodEnd && sub.currentPeriodEnd > now;
  const start = stillActive ? sub.currentPeriodEnd! : now;
  const end = new Date(start);
  end.setMonth(end.getMonth() + months);

  const invoiceId = await db.transaction(async (tx) => {
    await tx
      .update(subscriptions)
      .set({ planCode: plan.code, status: "active", provider: "manual", currentPeriodEnd: end, cancelAtPeriodEnd: false, updatedAt: now })
      .where(eq(subscriptions.orgId, input.orgId));
    const handled = await tx
      .update(planRequests)
      .set({ status: "activated", planCode: plan.code, handledBy: input.staffEmail, handledAt: now })
      .where(and(eq(planRequests.orgId, input.orgId), eq(planRequests.status, "pending")))
      .returning({ id: planRequests.id });
    // Activated without a request (e.g. a renewal agreed by phone): still greet the agency once.
    if (handled.length === 0) {
      await tx.insert(planRequests).values({ orgId: input.orgId, planCode: plan.code, status: "activated", handledBy: input.staffEmail, handledAt: now });
    }
    const [inv] = await tx
      .insert(invoices)
      .values({
        orgId: input.orgId,
        planCode: plan.code,
        amountCents,
        currency: plan.currency,
        periodStart: start,
        periodEnd: end,
        provider: "manual",
        providerInvoiceId: `manual_${randomUUID()}`,
      })
      .returning({ id: invoices.id });
    return inv.id;
  });
  if (amountCents > 0) await sendInvoiceEmail(invoiceId);
  return { ok: true as const, until: end };
}

export async function dismissRequest(id: string, staffEmail: string) {
  await db
    .update(planRequests)
    .set({ status: "dismissed", handledBy: staffEmail, handledAt: new Date() })
    .where(and(eq(planRequests.id, id), eq(planRequests.status, "pending")));
}

/** An activation the agency's admins haven't been welcomed for yet. */
export async function unwelcomedActivation(orgId: string) {
  return db.query.planRequests.findFirst({
    where: and(eq(planRequests.orgId, orgId), eq(planRequests.status, "activated"), isNull(planRequests.welcomedAt)),
    orderBy: desc(planRequests.handledAt),
  });
}

export async function markWelcomed(orgId: string) {
  await db
    .update(planRequests)
    .set({ welcomedAt: new Date() })
    .where(and(eq(planRequests.orgId, orgId), eq(planRequests.status, "activated"), isNull(planRequests.welcomedAt)));
}
