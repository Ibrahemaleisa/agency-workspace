"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { organizations, plans, platformAdmins, sessions, subscriptions, users } from "@/db/schema";
import { completeSecondFactor, createPlatformSession, destroyPlatformSession, getPlatformSession, requirePlatformAdmin, verifyPlatformAdmin } from "@/lib/platform-admin";
import { verifyTotp } from "@/lib/totp";
import { idOf, str, type ActionState } from "@/lib/action-state";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { isUuid } from "@/lib/access";
import { activatePlan, dismissRequest, saveBankDetails } from "@/lib/billing/manual";
import { issueResetLink } from "@/lib/password-reset";
import { DEFAULT_TRIAL_DAYS } from "@/lib/billing/defaults";
import { audit } from "@/lib/audit";
import { ProviderCancelError, deleteOrganization } from "@/lib/lifecycle";

export async function platformLogin(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const email = str(fd, "email")?.toLowerCase() ?? "";
  const password = str(fd, "password") ?? "";
  if (!(await rateLimit(`operra-login:${await clientIp()}`, 10, 900))) return { error: "Too many attempts. Try again later." };
  const admin = email && password ? await verifyPlatformAdmin(email, password) : null;
  if (!admin) return { error: "Invalid email or password." };
  if (admin.totpEnabledAt) {
    // Password proven; the authenticator code comes next.
    await createPlatformSession(admin.id, { pending2fa: true });
    redirect("/operra/login/2fa");
  }
  // No authenticator yet: the only page this session opens is the set-up page.
  await createPlatformSession(admin.id);
  await audit({ adminEmail: admin.email, action: "staff.sign_in", meta: { secondFactor: false } });
  redirect("/operra/security");
}

/** Second step of signing in: the 6-digit code from the authenticator app. */
export async function verifySecondFactor(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const s = await getPlatformSession();
  if (!s) redirect("/operra/login");
  if (!s.pending2fa) redirect("/operra");
  if (!(await rateLimit(`operra-2fa:${s.admin.id}`, 8, 900))) return { error: "Too many attempts. Sign in again later." };
  const row = await db.query.platformAdmins.findFirst({ where: eq(platformAdmins.id, s.admin.id) });
  const step = row?.totpSecret ? verifyTotp(row.totpSecret, str(fd, "code") ?? "", row.totpLastStep) : null;
  if (!row || step === null) return { error: "That code isn’t right. Use the current code from your authenticator app." };
  await db.update(platformAdmins).set({ totpLastStep: step }).where(eq(platformAdmins.id, row.id));
  await completeSecondFactor(s.tokenHash);
  await audit({ adminEmail: row.email, action: "staff.sign_in", meta: { secondFactor: true } });
  redirect("/operra");
}

/** Turns the authenticator on, once the person proves their app shows the right code. */
export async function confirmTotpEnrollment(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requirePlatformAdmin({ enrolling: true });
  if (!(await rateLimit(`operra-2fa-enroll:${admin.id}`, 10, 900))) return { error: "Too many attempts. Try again later." };
  const row = await db.query.platformAdmins.findFirst({ where: eq(platformAdmins.id, admin.id) });
  if (!row?.totpSecret || row.totpEnabledAt) redirect("/operra");
  const step = verifyTotp(row.totpSecret, str(fd, "code") ?? "");
  if (step === null) return { error: "That code isn’t right. Check the time on your phone and try the current code." };
  await db.update(platformAdmins).set({ totpEnabledAt: new Date(), totpLastStep: step }).where(eq(platformAdmins.id, row.id));
  await audit({ adminEmail: row.email, action: "staff.2fa_enabled" });
  redirect("/operra");
}

export async function platformLogout() {
  await destroyPlatformSession();
  redirect("/operra/login");
}

/** Pause or restore a tenant. Pausing also ends its users' sessions. */
export async function setTenantStatus(fd: FormData) {
  const admin = await requirePlatformAdmin();
  const orgId = idOf(fd, "orgId");
  const status = str(fd, "status");
  if (!isUuid(orgId) || (status !== "active" && status !== "suspended")) return;
  const org = await db.query.organizations.findFirst({ where: eq(organizations.id, orgId) });
  if (!org || org.isDemo) return;
  await db.update(organizations).set({ status, updatedAt: new Date() }).where(eq(organizations.id, orgId));
  if (status === "suspended") {
    await db.delete(sessions).where(sql`${sessions.userId} in (select ${users.id} from ${users} where ${users.orgId} = ${orgId})`);
  }
  await audit({ adminEmail: admin.email, action: status === "suspended" ? "tenant.paused" : "tenant.restored", orgId, target: org.serial });
  revalidatePath(`/operra/customers/${orgId}`);
}

/** Extend a trial by N days from today or from its current end, whichever is later. */
export async function extendTrial(fd: FormData) {
  const admin = await requirePlatformAdmin();
  const orgId = idOf(fd, "orgId");
  const days = Math.min(90, Math.max(1, Number(str(fd, "days") ?? 0) || 0));
  if (!isUuid(orgId)) return;
  const sub = await db.query.subscriptions.findFirst({ where: eq(subscriptions.orgId, orgId) });
  // Only free trials (running or ended); anything backed by the payment provider is managed there.
  if (!sub || sub.status === "active" || sub.providerSubscriptionId) return;
  const from = Math.max(Date.now(), sub.trialEndsAt?.getTime() ?? 0);
  await db
    .update(subscriptions)
    .set({ status: "trialing", trialEndsAt: new Date(from + days * 86_400_000), updatedAt: new Date() })
    .where(eq(subscriptions.orgId, orgId));
  await audit({ adminEmail: admin.email, action: "trial.extended", orgId, meta: { days } });
  revalidatePath(`/operra/customers/${orgId}`);
}

/**
 * Edit a plan: trial length, display price, provider price ID, availability. Changes apply to new
 * sign-ups and checkouts; running trials keep their end dates.
 */
const lines = (v: string | null | undefined, max = 12) =>
  (v ?? "")
    .split("\n")
    .map((l) => l.trim().slice(0, 120))
    .filter(Boolean)
    .slice(0, max);

/** Validates the editable fields shared by "new plan" and "save plan". */
function planFields(fd: FormData): { error: string } | { values: Omit<typeof plans.$inferInsert, "code"> } {
  const name = str(fd, "name")?.slice(0, 80);
  const trialDays = Number(str(fd, "trialDays") ?? DEFAULT_TRIAL_DAYS);
  if (!name) return { error: "Name is required." };
  if (!Number.isInteger(trialDays) || trialDays < 0 || trialDays > 90) return { error: "Trial length must be 0–90 days." };
  // Display price: blank = not published ("priced on request"). Stripe holds the real price.
  const priceRaw = str(fd, "price");
  const price = priceRaw ? Number(priceRaw) : null;
  if (price !== null && (!Number.isFinite(price) || price < 0 || price > 1_000_000)) return { error: "Price must be a positive number, or blank." };
  const currency = (str(fd, "currency") ?? "USD").toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) return { error: "Currency must be a 3-letter code, e.g. USD or SAR." };
  const interval = str(fd, "interval") === "year" ? "year" : "month";
  const stripePriceId = str(fd, "stripePriceId") ?? null;
  if (stripePriceId && !/^(price_[A-Za-z0-9]+|\d{1,12})$/.test(stripePriceId)) return { error: "Use a Lemon Squeezy variant ID (digits) or a Stripe price ID (price_…)." };
  const sort = Number(str(fd, "sort") ?? 0);
  return {
    values: {
      name,
      nameAr: str(fd, "nameAr")?.slice(0, 80) ?? null,
      description: str(fd, "description")?.slice(0, 200) ?? null,
      descriptionAr: str(fd, "descriptionAr")?.slice(0, 200) ?? null,
      features: lines(str(fd, "features")),
      featuresAr: lines(str(fd, "featuresAr")),
      featured: str(fd, "featured") === "on",
      trialDays,
      priceCents: price === null ? null : Math.round(price * 100),
      currency,
      interval,
      stripePriceId,
      sort: Number.isInteger(sort) ? Math.max(-100, Math.min(100, sort)) : 0,
      active: str(fd, "active") === "on",
    },
  };
}

export async function updatePlan(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requirePlatformAdmin();
  const code = str(fd, "code") ?? "";
  const plan = await db.query.plans.findFirst({ where: eq(plans.code, code) });
  if (!plan) return { error: "Unknown plan." };
  const r = planFields(fd);
  if ("error" in r) return r;
  await db.update(plans).set(r.values).where(eq(plans.code, code));
  await audit({
    adminEmail: admin.email,
    action: "plan.updated",
    target: code,
    meta: { trialDays: r.values.trialDays ?? null, priceCents: r.values.priceCents ?? null, active: r.values.active ?? null, maxStorageMb: r.values.maxStorageMb ?? null },
  });
  revalidatePath("/operra/plans");
  return { ok: true };
}

/** Adds a plan. Its code is permanent (used in links and subscriptions). */
export async function createPlan(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requirePlatformAdmin();
  const code = (str(fd, "code") ?? "").toLowerCase();
  if (!/^[a-z][a-z0-9-]{1,30}$/.test(code)) return { error: "Code: 2–31 lowercase letters, digits or dashes, starting with a letter (e.g. growth)." };
  if (await db.query.plans.findFirst({ where: eq(plans.code, code) })) return { error: "A plan with that code already exists." };
  const r = planFields(fd);
  if ("error" in r) return r;
  await db.insert(plans).values({ code, ...r.values });
  await audit({ adminEmail: admin.email, action: "plan.created", target: code });
  revalidatePath("/operra/plans");
  return { ok: true };
}

/** Staff: activate a plan for N months after the agency paid (manual billing). */
export async function activatePlanAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requirePlatformAdmin();
  const orgId = idOf(fd, "orgId");
  if (!isUuid(orgId)) return { error: "Unknown workspace." };
  const amountRaw = str(fd, "amount");
  const amount = amountRaw ? Number(amountRaw) : null;
  if (amount !== null && (!Number.isFinite(amount) || amount < 0 || amount > 1_000_000)) return { error: "Amount must be a positive number, or blank for the plan price." };
  const r = await activatePlan({
    orgId,
    planCode: str(fd, "plan") ?? "",
    months: Number(str(fd, "months") ?? 1) || 1,
    amountCents: amount === null ? null : Math.round(amount * 100),
    staffEmail: admin.email,
  });
  if ("error" in r) return { error: r.error };
  await audit({ adminEmail: admin.email, action: "plan.activated", orgId, target: str(fd, "plan"), meta: { until: r.until.toISOString(), months: Number(str(fd, "months") ?? 1) || 1, amountCents: amount === null ? null : Math.round(amount * 100) } });
  revalidatePath(`/operra/customers/${orgId}`);
  revalidatePath("/operra");
  return { ok: true };
}

export async function dismissRequestAction(fd: FormData) {
  const admin = await requirePlatformAdmin();
  const id = idOf(fd, "requestId");
  if (!isUuid(id)) return;
  await dismissRequest(id, admin.email);
  await audit({ adminEmail: admin.email, action: "plan_request.dismissed", target: id });
  revalidatePath("/operra");
}

/** Staff: a one-time password reset link to give the person directly (support, or no email set up). */
export async function resetLinkAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requirePlatformAdmin();
  const accountId = idOf(fd, "accountId");
  if (!isUuid(accountId)) return { error: "Unknown person." };
  const link = await issueResetLink(accountId);
  await audit({ adminEmail: admin.email, action: "account.reset_link", target: accountId });
  return { ok: true, link };
}

/** Staff: the bank account agencies can transfer to (optional backup to card payment). Empty IBAN = off. */
export async function saveBankAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requirePlatformAdmin();
  const iban = (str(fd, "iban") ?? "").replace(/\s+/g, "").toUpperCase();
  if (iban && !/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban)) return { error: "That doesn’t look like an IBAN (e.g. SA03 8000 0000 6080 1016 7519)." };
  await saveBankDetails(
    {
      bankName: str(fd, "bankName")?.slice(0, 80) ?? "",
      accountName: str(fd, "accountName")?.slice(0, 120) ?? "",
      iban: iban.replace(/(.{4})/g, "$1 ").trim(),
      instructionsEn: str(fd, "instructionsEn")?.slice(0, 500) ?? "",
      instructionsAr: str(fd, "instructionsAr")?.slice(0, 500) ?? "",
    },
    admin.email,
  );
  await audit({ adminEmail: admin.email, action: "bank_details.saved", meta: { ibanSet: !!iban } });
  revalidatePath("/operra/payments");
  return { ok: true };
}

/** Staff: delete a workspace for good (typed confirmation). Stops its payment-provider subscription first. */
export async function deleteTenantAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requirePlatformAdmin();
  const orgId = idOf(fd, "orgId");
  const org = await db.query.organizations.findFirst({ where: eq(organizations.id, orgId) });
  if (!org || org.isDemo) return { error: "Unknown workspace (or the preview tenant, which can't be deleted)." };
  if ((str(fd, "confirm") ?? "") !== org.slug) return { error: "Type the workspace address exactly to confirm." };
  try {
    await deleteOrganization(org.id);
  } catch (err) {
    if (err instanceof ProviderCancelError) return { error: "The payment provider didn't confirm the cancellation, so nothing was deleted. Try again." };
    throw err;
  }
  await audit({ adminEmail: admin.email, action: "tenant.deleted", target: `${org.serial} ${org.slug}`, meta: { name: org.name } });
  revalidatePath("/operra");
  redirect("/operra");
}
