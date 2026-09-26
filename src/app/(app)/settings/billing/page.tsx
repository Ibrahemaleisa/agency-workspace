import { format } from "date-fns";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { plans } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { getT } from "@/lib/lang";
import { getSaasT } from "@/lib/i18n-saas";
import { billingProvider, getSubscription, trialDaysLeft } from "@/lib/billing";
import { isPlatform, tenantEntryUrl } from "@/lib/platform";
import { getOrgById } from "@/lib/tenant";
import { openBillingPortal, startCheckout } from "@/server/billing-actions";
import { Badge, Card, PageHeader, buttonClass } from "@/components/ui";
import { AutoSubmitForm } from "@/components/auto-submit";

export async function generateMetadata() {
  const { t } = await getSaasT();
  return { title: t.billing.title };
}

export default async function BillingPage({ searchParams }: PageProps<"/settings/billing">) {
  if (!isPlatform()) notFound();
  const user = await requirePermission("billing.manage");
  const sp = await searchParams;
  const [{ t: st }, { locale }] = await Promise.all([getSaasT(), getT()]);
  const b = st.billing;
  const org = (await getOrgById(user.orgId))!;
  const sub = await getSubscription(org.id);
  const plan = sub ? await db.query.plans.findFirst({ where: eq(plans.code, sub.planCode) }) : null;
  const provider = billingProvider();
  const days = sub ? trialDaysLeft(sub) : null;
  const fmt = (d: Date) => format(d, "d MMM yyyy", { locale });
  const canPay = !!provider && !!sub && !org.isDemo && sub.status !== "active";
  const tone = sub?.status === "active" ? "green" : sub?.status === "trialing" ? "blue" : "amber";
  const notice =
    sp.checkout === "success"
      ? sub?.status === "active"
        ? { cls: "border-emerald-200 bg-emerald-50 text-emerald-800", text: b.success }
        : { cls: "border-zinc-200 bg-zinc-50 text-zinc-700", text: b.pending }
      : sp.checkout === "cancelled"
        ? { cls: "border-zinc-200 bg-zinc-50 text-zinc-700", text: b.cancelled }
        : null;

  return (
    <>
      <PageHeader title={b.title} description={b.sub} />
      {notice && <div role="status" className={`mb-6 rounded-lg border px-4 py-3 text-sm ${notice.cls}`}>{notice.text}</div>}
      {provider?.name === "test" && (
        <div className="mb-6 rounded-lg border border-dashed border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-900">{b.testMode}</div>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={b.plan}>
          {sub ? (
            <dl className="divide-y divide-zinc-100 text-sm">
              <div className="flex justify-between gap-4 py-2.5">
                <dt className="text-zinc-500">{b.plan}</dt>
                <dd className="font-medium">{plan?.name ?? sub.planCode}</dd>
              </div>
              <div className="flex justify-between gap-4 py-2.5">
                <dt className="text-zinc-500">{b.status}</dt>
                <dd>
                  <Badge tone={tone}>{b.statuses[sub.status]}</Badge>
                </dd>
              </div>
              {sub.status === "trialing" && sub.trialEndsAt && (
                <div className="flex justify-between gap-4 py-2.5">
                  <dt className="text-zinc-500">{b.trialEnds(fmt(sub.trialEndsAt))}</dt>
                  <dd className="font-medium tabular-nums">{days !== null && b.daysLeft(days)}</dd>
                </div>
              )}
              {sub.currentPeriodEnd && sub.status !== "trialing" && (
                <div className="flex justify-between gap-4 py-2.5">
                  <dt className="text-zinc-500">{sub.cancelAtPeriodEnd ? b.cancels(fmt(sub.currentPeriodEnd)) : b.renews(fmt(sub.currentPeriodEnd))}</dt>
                  <dd />
                </div>
              )}
              <div className="flex justify-between gap-4 py-2.5">
                <dt className="text-zinc-500">{b.price}</dt>
                <dd>
                  {plan?.priceCents != null
                    ? new Intl.NumberFormat("en", { style: "currency", currency: plan.currency }).format(plan.priceCents / 100)
                    : b.priceOnRequest}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-zinc-500">—</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {canPay && (
              <form action={startCheckout}>
                <button className={buttonClass("primary")}>{b.subscribe}</button>
              </form>
            )}
            {provider && sub?.providerCustomerId && provider.name === "stripe" && (
              <form action={openBillingPortal}>
                <button className={buttonClass("secondary")}>{b.manage}</button>
              </form>
            )}
          </div>
          {!provider && isPlatform() && <p className="mt-4 text-sm text-zinc-500">{b.notConfigured}</p>}
          {sp.start === "checkout" && canPay && (
            <AutoSubmitForm action={startCheckout}>
              <p className="mt-4 text-sm text-zinc-500" role="status">…</p>
            </AutoSubmitForm>
          )}
        </Card>
        <Card title={b.instance}>
          <dl className="divide-y divide-zinc-100 text-sm">
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="text-zinc-500">{b.instance}</dt>
              <dd className="font-mono font-medium" data-testid="billing-serial">{org.serial}</dd>
            </div>
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="text-zinc-500">{b.address}</dt>
              <dd className="font-mono text-xs" dir="ltr">{tenantEntryUrl(org).replace(/^https?:\/\//, "")}</dd>
            </div>
          </dl>
        </Card>
      </div>
    </>
  );
}
