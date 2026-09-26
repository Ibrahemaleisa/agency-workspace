import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSaasT } from "@/lib/i18n-saas";
import { getT } from "@/lib/lang";
import { currentSignup, signupBrand } from "@/server/signup-actions";
import { SignupShell } from "@/components/platform/signup-shell";
import { BrandForm } from "@/components/platform/brand-form";

export const metadata: Metadata = { title: "Your brand · Operra" };

export default async function SignupBrandPage() {
  const signup = await currentSignup();
  if (!signup) redirect("/signup?expired=1");
  if (signup.orgId) redirect("/signup/provisioning");
  if (signup.step < 2) redirect("/signup/company");
  const [{ t, lang }, { t: app }] = await Promise.all([getSaasT(), getT()]);
  const s = t.signup;
  const name = (lang === "ar" && signup.companyNameAr) || signup.companyName || "";
  return (
    <SignupShell bare steps={s.steps} current={2} title={s.brand.title} sub={s.brand.sub}>
      <BrandForm
        action={signupBrand}
        name={name}
        backHref="/signup/company"
        initial={{ logo: signup.logo, primary: signup.primaryColor ?? "#121519", accent: signup.accentColor ?? "#e8dcc8" }}
        labels={{
          ...s.brand,
          back: s.back,
          continue: s.continue,
          nav: [app.nav.dashboard, app.nav.projects, app.nav.tasks, app.nav.approvals, app.nav.clients],
          stats: [app.dashboard.activeProjects, app.dashboard.pendingApprovals, app.dashboard.inReview, app.dashboard.overdueTasks],
          button: app.nav.projects,
          badge: app.nav.approvals,
          greeting: app.dashboard.agencyOverview,
        }}
      />
    </SignupShell>
  );
}
