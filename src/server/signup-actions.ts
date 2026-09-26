"use server";

import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { plans, signups, users, type Signup } from "@/db/schema";
import { createSession, hashPassword, hashToken, newToken } from "@/lib/auth";
import { HEX } from "@/lib/brand";
import { str, type ActionState } from "@/lib/action-state";
import { getSaasT } from "@/lib/i18n-saas";
import { getLang } from "@/lib/lang";
import { RESERVED_SLUGS, SLUG_RE, isPlatform, slugify, tenantEntryUrl } from "@/lib/platform";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { ProvisioningError, provisionSignup, slugAvailable } from "@/lib/provisioning";
import { providerName } from "@/lib/billing";
import { workspaceRedirectUrl } from "@/lib/handoff";
import { getOrgById, rememberTenant } from "@/lib/tenant";

const SIGNUP_COOKIE = "operra_signup";
const SIGNUP_HOURS = 24;
const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const MAX_LOGO_BYTES = 300 * 1024;
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 200;

function platformOnly() {
  if (!isPlatform()) notFound();
}

/** The signup attached to this browser, if it hasn't expired. */
export async function currentSignup(): Promise<Signup | null> {
  const token = (await cookies()).get(SIGNUP_COOKIE)?.value;
  if (!token) return null;
  return (
    (await db.query.signups.findFirst({
      where: and(eq(signups.tokenHash, hashToken(token)), gt(signups.expiresAt, new Date())),
    })) ?? null
  );
}

async function requireSignup(minStep: number): Promise<Signup> {
  const s = await currentSignup();
  if (!s) redirect("/signup?expired=1");
  if (s.orgId) redirect("/signup/provisioning");
  if (s.step < minStep) redirect(["/signup", "/signup/company", "/signup/brand", "/signup/start"][s.step] ?? "/signup");
  return s;
}

/* Step 1 — account */
export async function signupAccount(_prev: ActionState, fd: FormData): Promise<ActionState> {
  platformOnly();
  const { t } = await getSaasT();
  const e = t.signup.errors;
  const name = str(fd, "name")?.slice(0, 120);
  const email = str(fd, "email")?.toLowerCase() ?? "";
  const password = str(fd, "password") ?? "";
  if (!name) return { error: e.name };
  if (!isEmail(email)) return { error: e.email };
  if (password.length < 8) return { error: e.password };
  if (!(await rateLimit(`signup:${await clientIp()}`, 10, 3600))) return { error: e.rate };
  if (await db.query.users.findFirst({ where: eq(users.email, email) })) return { error: e.emailTaken };

  const planCode = str(fd, "plan") ?? "workspace";
  const plan = await db.query.plans.findFirst({ where: and(eq(plans.code, planCode), eq(plans.active, true)) });
  if (!plan) return { error: e.billing };

  const values = {
    name,
    email,
    passwordHash: await hashPassword(password),
    lang: await getLang(),
    planCode: plan.code,
    step: 1,
    updatedAt: new Date(),
    expiresAt: new Date(Date.now() + SIGNUP_HOURS * 3600_000),
  };
  const existing = await currentSignup();
  if (existing && !existing.orgId) {
    await db.update(signups).set(values).where(eq(signups.id, existing.id));
  } else {
    const token = newToken();
    await db.insert(signups).values({ ...values, tokenHash: hashToken(token) });
    (await cookies()).set(SIGNUP_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SIGNUP_HOURS * 3600,
    });
  }
  redirect("/signup/company");
}

/* Step 2 — company */
export async function signupCompany(_prev: ActionState, fd: FormData): Promise<ActionState> {
  platformOnly();
  const s = await requireSignup(1);
  const e = (await getSaasT()).t.signup.errors;
  const companyName = str(fd, "companyName")?.slice(0, 120);
  if (!companyName) return { error: e.company };
  const slug = slugify(str(fd, "slug") ?? companyName);
  if (!SLUG_RE.test(slug)) return { error: e.slug };
  if (!(await slugAvailable(slug))) {
    return { error: RESERVED_SLUGS.has(slug) ? e.slugReserved : e.slugTaken };
  }
  await db
    .update(signups)
    .set({
      companyName,
      companyNameAr: str(fd, "companyNameAr")?.slice(0, 120) ?? null,
      slug,
      defaultLang: str(fd, "defaultLang") === "ar" ? "ar" : "en",
      step: Math.max(s.step, 2),
      updatedAt: new Date(),
    })
    .where(eq(signups.id, s.id));
  redirect("/signup/brand");
}

/* Step 3 — brand */
export async function signupBrand(_prev: ActionState, fd: FormData): Promise<ActionState> {
  platformOnly();
  const s = await requireSignup(2);
  const e = (await getSaasT()).t.signup.errors;
  const primaryColor = str(fd, "primaryColor") ?? "";
  const accentColor = str(fd, "accentColor") ?? "";
  if (!HEX.test(primaryColor) || !HEX.test(accentColor)) return { error: e.color };

  let logo = s.logo;
  const file = fd.get("logo");
  if (str(fd, "removeLogo") === "1") logo = null;
  else if (file instanceof File && file.size > 0) {
    if (!LOGO_TYPES.includes(file.type)) return { error: e.logoType };
    if (file.size > MAX_LOGO_BYTES) return { error: e.logoSize };
    logo = `data:${file.type};base64,${Buffer.from(await file.arrayBuffer()).toString("base64")}`;
  }
  await db
    .update(signups)
    .set({ primaryColor, accentColor, logo, step: Math.max(s.step, 3), updatedAt: new Date() })
    .where(eq(signups.id, s.id));
  redirect("/signup/start");
}

/* Step 4 — choose how to start, then provision */
export async function signupStart(_prev: ActionState, fd: FormData): Promise<ActionState> {
  platformOnly();
  const s = await requireSignup(3);
  const mode = str(fd, "mode") === "subscribe" && providerName() ? "subscribe" : "trial";
  // Re-check the address: someone may have taken it since step 2.
  if (!(await slugAvailable(s.slug ?? ""))) return { error: (await getSaasT()).t.signup.errors.slugTaken };
  await db.update(signups).set({ startMode: mode, step: 4, updatedAt: new Date() }).where(eq(signups.id, s.id));
  redirect("/signup/provisioning");
}

export type ProvisionState =
  | { status: "completed"; serial: string; entry: string }
  | { status: "failed"; error: string; restart?: boolean };

/** Runs (or resumes) provisioning for this browser's signup. Idempotent. */
export async function runProvisioning(): Promise<ProvisionState> {
  platformOnly();
  const { t } = await getSaasT();
  const s = await currentSignup();
  if (!s || s.step < 4) return { status: "failed", error: t.signup.errors.expired, restart: true };
  try {
    const r = await provisionSignup(s.id);
    const org = await getOrgById(r.orgId);
    return { status: "completed", serial: r.serial, entry: org ? tenantEntryUrl(org).replace(/^https?:\/\//, "") : r.slug };
  } catch (err) {
    if (err instanceof ProvisioningError && err.code !== "incomplete") {
      return { status: "failed", error: err.code === "slugTaken" ? t.signup.errors.slugTaken : t.signup.errors.emailTaken, restart: true };
    }
    return { status: "failed", error: t.signup.provisioning.failed };
  }
}

/** Signs the new admin in on their workspace's own host and ends the signup session. */
export async function enterWorkspace() {
  platformOnly();
  const s = await currentSignup();
  if (!s?.orgId) redirect("/signup");
  const org = await getOrgById(s.orgId);
  const admin = await db.query.users.findFirst({ where: and(eq(users.email, s.email), eq(users.orgId, s.orgId)) });
  if (!org || !admin || org.status !== "active") redirect("/signup/provisioning");

  (await cookies()).delete(SIGNUP_COOKIE);
  const next = s.startMode === "subscribe" ? "/settings/billing?start=checkout" : "/";
  const target = await workspaceRedirectUrl(org, admin.id, next);
  if (target) redirect(target);
  if (org) await rememberTenant(org);
  await createSession(admin.id);
  redirect(next);
}
