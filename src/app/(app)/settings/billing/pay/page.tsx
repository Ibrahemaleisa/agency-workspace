import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { plans } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { getT } from "@/lib/lang";
import { getSaasT } from "@/lib/i18n-saas";
import { isPlatform } from "@/lib/platform";
import { getOrgById } from "@/lib/tenant";
import { providerName } from "@/lib/billing";
import { getBankDetails } from "@/lib/billing/manual";
import { PayForm } from "@/components/pay-form";
import { planPrice, planText } from "@/components/platform/plan-options";
import { Card, PageHeader, buttonClass } from "@/components/ui";
import { requestPlanAction } from "@/server/billing-actions";

export async function generateMetadata() {
  const { t } = await getSaasT();
  return { title: t.pay.title };
}

/** Bank transfer for a plan: amount, account details, reference and receipt upload. */
export default async function PayPage({ searchParams }: PageProps<"/settings/billing/pay">) {
  if (!isPlatform()) notFound();
  // With online payment connected, subscribing goes through its checkout instead.
  if (providerName()) redirect("/settings/billing");
  const user = await requirePermission("billing.manage");
  const code = String((await searchParams).plan ?? "");
  const plan = await db.query.plans.findFirst({ where: and(eq(plans.code, code), eq(plans.active, true)) });
  if (!plan || plan.priceCents == null) redirect("/settings/billing");
  const [{ t: st }, { lang }, org, bank] = await Promise.all([getSaasT(), getT(), getOrgById(user.orgId), getBankDetails()]);
  const p = st.pay;
  const text = planText(plan, lang);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={p.title} description={p.sub} />
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-4">
          <div>
            <p className="text-xs text-zinc-500">{p.plan}</p>
            <p className="text-lg font-semibold">
              {text.name} <span className="text-sm font-normal text-zinc-500">· {planPrice(plan, lang, st.billing)}</span>
            </p>
          </div>
          <Link href="/settings/billing#plans-title" className="text-sm underline underline-offset-4">
            {p.change}
          </Link>
        </div>
        <div className="pt-5">
          {bank ? (
            <PayForm
              planCode={plan.code}
              monthlyCents={plan.priceCents}
              currency={plan.currency}
              lang={lang}
              bank={{ bankName: bank.bankName, accountName: bank.accountName, iban: bank.iban, instructions: lang === "ar" ? bank.instructionsAr || bank.instructionsEn : bank.instructionsEn || bank.instructionsAr }}
              reference={org!.serial}
              labels={{ ...p, months: [1, 3, 6, 12].map((m) => p.months(m)) }}
            />
          ) : (
            // No card payment and no bank details yet: the agency confirms the plan; Operra activates it.
            <form action={requestPlanAction} className="space-y-4">
              <input type="hidden" name="plan" value={plan.code} />
              <p className="text-sm text-zinc-600">{p.notReady}</p>
              <button className={`${buttonClass("primary")} w-full`} data-testid="confirm-plan">
                {p.confirm}
              </button>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
}
