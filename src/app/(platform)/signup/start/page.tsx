import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { plans } from "@/db/schema";
import { getSaasT } from "@/lib/i18n-saas";
import { addressTemplate } from "@/lib/signup-view";
import { providerName } from "@/lib/billing";
import { currentSignup, signupStart } from "@/server/signup-actions";
import { ActionForm, SubmitButton } from "@/components/forms";
import { buttonClass } from "@/components/ui";
import { SignupShell } from "@/components/platform/signup-shell";

export const metadata: Metadata = { title: "Start your workspace · Operra" };

export default async function SignupStartPage() {
  const signup = await currentSignup();
  if (!signup) redirect("/signup?expired=1");
  if (signup.orgId) redirect("/signup/provisioning");
  if (signup.step < 3) redirect("/signup/brand");
  const { t } = await getSaasT();
  const s = t.signup;
  const plan = await db.query.plans.findFirst({ where: eq(plans.code, signup.planCode) });
  const payments = !!providerName();
  const row = "flex items-baseline justify-between gap-4 border-b border-[#E3E4E0] py-2.5 text-sm last:border-0";

  return (
    <SignupShell
      steps={s.steps}
      current={3}
      title={s.start.title}
      sub={s.start.sub}
      aside={
        <div className="rounded-xl border border-[#E3E4E0] bg-white p-5 sm:p-6 lg:mt-[92px]">
          <p className="font-mono text-[11px] tracking-[0.08em] text-[#5A606B] uppercase">{s.start.summary}</p>
          <dl className="mt-3">
            <div className={row}>
              <dt className="text-[#5A606B]">{s.start.company}</dt>
              <dd className="font-medium">{signup.companyName}</dd>
            </div>
            <div className={row}>
              <dt className="text-[#5A606B]">{s.start.address}</dt>
              <dd className="font-mono text-xs" dir="ltr">{addressTemplate().replace("{slug}", signup.slug ?? "")}</dd>
            </div>
            <div className={row}>
              <dt className="text-[#5A606B]">{s.start.colours}</dt>
              <dd className="flex gap-1.5">
                {[signup.primaryColor, signup.accentColor].map((c) => (
                  <span key={c} className="size-5 rounded border border-zinc-300" style={{ background: c ?? undefined }} title={c ?? ""} />
                ))}
              </dd>
            </div>
          </dl>
        </div>
      }
    >
      <ActionForm action={signupStart} className="space-y-4">
        <label className="flex cursor-pointer gap-3 rounded-lg border border-zinc-300 p-4 has-checked:border-zinc-900 has-checked:ring-1 has-checked:ring-zinc-900">
          <input type="radio" name="mode" value="trial" defaultChecked className="mt-1" />
          <span>
            <span className="block font-semibold">{s.start.trialTitle(plan?.trialDays ?? 14)}</span>
            <span className="mt-1 block text-sm text-zinc-600">{s.start.trialBody}</span>
          </span>
        </label>
        {payments ? (
          <label className="flex cursor-pointer gap-3 rounded-lg border border-zinc-300 p-4 has-checked:border-zinc-900 has-checked:ring-1 has-checked:ring-zinc-900">
            <input type="radio" name="mode" value="subscribe" className="mt-1" />
            <span>
              <span className="block font-semibold">{s.start.payTitle}</span>
              <span className="mt-1 block text-sm text-zinc-600">{s.start.payBody}</span>
            </span>
          </label>
        ) : (
          <p className="text-sm text-zinc-500">{s.start.billingOff}</p>
        )}
        <div className="flex items-center justify-between gap-3 pt-2">
          <a href="/signup/brand" className={buttonClass("ghost")}>
            {s.back}
          </a>
          <SubmitButton>{s.continue}</SubmitButton>
        </div>
      </ActionForm>
    </SignupShell>
  );
}
