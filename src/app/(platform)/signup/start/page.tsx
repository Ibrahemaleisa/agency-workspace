import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { plans } from "@/db/schema";
import { getSaasT } from "@/lib/i18n-saas";
import { getLang } from "@/lib/lang";
import { planPrice, planText } from "@/components/platform/plan-options";
import { addressTemplate } from "@/lib/signup-view";
import { providerName } from "@/lib/billing";
import { currentSignup, signupStart } from "@/server/signup-actions";
import { ActionForm } from "@/components/forms";
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
  const lang = await getLang();
  const offered = await db.select().from(plans).where(eq(plans.active, true)).orderBy(asc(plans.sort), asc(plans.code));
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
      {/* One card per plan: paying is the main action, the free trial a link inside the same card. */}
      <p className="mb-3 font-semibold">{s.start.planTitle}</p>
      <div className={`grid gap-4 ${offered.length > 1 ? "sm:grid-cols-2" : ""}`} data-testid="plan-cards">
        {offered.map((p) => {
          const text = planText(p, lang);
          return (
            <ActionForm
              key={p.code}
              action={signupStart}
              className={`flex flex-col rounded-xl border bg-white p-5 ${p.featured ? "border-zinc-900 ring-1 ring-zinc-900" : "border-zinc-300"}`}
            >
              <input type="hidden" name="plan" value={p.code} />
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold">{text.name}</h2>
                {p.featured && <span className="rounded bg-zinc-900 px-1.5 py-0.5 text-[11px] font-medium text-white">{s.start.recommended}</span>}
              </div>
              {text.description && <p className="mt-0.5 text-sm text-zinc-500">{text.description}</p>}
              <p className="mt-3 text-lg font-semibold whitespace-nowrap">{planPrice(p, lang, s.start)}</p>
              {text.features.length > 0 && (
                <ul className="mt-3 space-y-1.5 text-sm text-zinc-700">
                  {text.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span aria-hidden>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-auto pt-5">
                <button
                  type="submit"
                  name="mode"
                  value="subscribe"
                  className={`${buttonClass("primary")} w-full`}
                  data-testid={`pay-${p.code}`}
                >
                  {s.start.subscribe}
                </button>
                {p.trialDays > 0 && (
                  <button
                    type="submit"
                    name="mode"
                    value="trial"
                    className="mt-3 block w-full text-center text-sm font-medium text-zinc-900 underline underline-offset-4 hover:text-zinc-600"
                    data-testid={`trial-${p.code}`}
                  >
                    {s.start.startTrial}
                  </button>
                )}
                {p.trialDays > 0 && <p className="mt-1 text-center text-xs text-zinc-500">{s.start.trialNote(p.trialDays)}</p>}
              </div>
            </ActionForm>
          );
        })}
      </div>
      {!payments && <p className="mt-4 text-sm text-zinc-500">{s.start.manualNote}</p>}
      <div className="mt-6">
        <a href="/signup/brand" className={buttonClass("ghost")}>
          {s.back}
        </a>
      </div>
    </SignupShell>
  );
}
