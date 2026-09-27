import Link from "next/link";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { invoices, plans } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { getT } from "@/lib/lang";
import { getSaasT } from "@/lib/i18n-saas";
import { billingProvider, effectiveStatus, getSubscription, subscribedInTrial, trialDaysLeft } from "@/lib/billing";
import { isPlatform, tenantEntryUrl } from "@/lib/platform";
import { getOrgById } from "@/lib/tenant";
import { openBillingPortal, startCheckout } from "@/server/billing-actions";
import { pendingRequest } from "@/lib/billing/manual";
import { formatMoney } from "@/lib/billing/invoice-email";
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
  const [{ t: st }, { locale, lang }] = await Promise.all([getSaasT(), getT()]);
  const b = st.billing;
  const org = (await getOrgById(user.orgId))!;
  const sub = await getSubscription(org.id);
  const plan = sub ? await db.query.plans.findFirst({ where: eq(plans.code, sub.planCode) }) : null;
  const paid = await db.select().from(invoices).where(eq(invoices.orgId, org.id)).orderBy(desc(invoices.createdAt)).limit(24);
  const offered = await db.select().from(plans).where(eq(plans.active, true)).orderBy(asc(plans.sort), asc(plans.code));
  const provider = billingProvider();
  const status = sub ? effectiveStatus(sub) : null;
  const paidTrial = !!sub && subscribedInTrial(sub);
  const days = sub && !paidTrial ? trialDaysLeft(sub) : null;
  const fmt = (d: Date) => format(d, "d MMM yyyy", { locale });
  const canPay = !!provider && !!sub && !org.isDemo && status !== "active" && status !== "past_due" && !paidTrial;
  const tone = status === "active" || paidTrial ? "green" : status === "trialing" ? "blue" : "amber";
  const planName = (p: { name: string; nameAr: string | null }) => (lang === "ar" && p.nameAr) || p.name;
  const priceOf = (p: { priceCents: number | null; currency: string; interval: string }) =>
    p.priceCents == null
      ? b.onRequest
      : `${new Intl.NumberFormat(lang === "ar" ? "ar-SA" : "en", { style: "currency", currency: p.currency, maximumFractionDigits: p.priceCents % 100 ? 2 : 0 }).format(p.priceCents / 100)} / ${p.interval === "year" ? b.perYear : b.perMonth}`;
  // Trials (running or ended) switch here; paid subscriptions switch with the provider.
  const canSwitch = !!sub && !org.isDemo && !sub.providerSubscriptionId;
  // Without online payment, subscribing is a request that Operra staff activate once paid.
  const canRequest = !provider && canSwitch;
  const manualActive = sub?.provider === "manual" && status === "active";
  const pending = canRequest ? await pendingRequest(org.id) : null;
  const pendingPlan = pending ? offered.find((p) => p.code === pending.planCode) : null;
  const notice =
    pending && pendingPlan
      ? {
          cls: "border-sky-200 bg-sky-50 text-sky-900",
          text: pending.transferredAt
            ? b.transferReceived(planName(pendingPlan), fmt(pending.transferredAt))
            : b.requested(planName(pendingPlan), fmt(pending.createdAt)),
        }
      : sp.plan === "changed"
      ? { cls: "border-emerald-200 bg-emerald-50 text-emerald-800", text: b.planChanged }
      : sp.checkout === "success"
      ? sub?.status === "active"
        ? { cls: "border-emerald-200 bg-emerald-50 text-emerald-800", text: b.success }
        : { cls: "border-zinc-200 bg-zinc-50 text-zinc-700", text: b.pending }
      : sp.checkout === "cancelled"
        ? { cls: "border-zinc-200 bg-zinc-50 text-zinc-700", text: b.cancelled }
        : sp.checkout === "error" || sp.checkout === "unavailable"
          ? { cls: "border-red-200 bg-red-50 text-red-800", text: b.checkoutError }
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
                <dd className="font-medium">{plan ? planName(plan) : sub.planCode}</dd>
              </div>
              <div className="flex justify-between gap-4 py-2.5">
                <dt className="text-zinc-500">{b.status}</dt>
                <dd>
                  <Badge tone={tone}>{paidTrial ? b.statuses.active : b.statuses[status!]}</Badge>
                </dd>
              </div>
              {status === "trialing" && sub.trialEndsAt && !paidTrial && (
                <div className="flex justify-between gap-4 py-2.5" data-testid="trial-row">
                  <dt className="text-zinc-500">{b.trialEnds(fmt(sub.trialEndsAt))}</dt>
                  <dd className="font-medium tabular-nums">{days !== null && b.daysLeft(days)}</dd>
                </div>
              )}
              {paidTrial && sub.trialEndsAt && (
                <div className="flex justify-between gap-4 py-2.5">
                  <dt className="text-zinc-500">{b.billingStarts(fmt(sub.trialEndsAt))}</dt>
                  <dd />
                </div>
              )}
              {status === "expired" && sub.trialEndsAt && (
                <div className="py-2.5" data-testid="trial-row">
                  <dt className="text-zinc-500">{b.trialEnded(fmt(sub.trialEndsAt))}</dt>
                  <dd className="mt-1 text-amber-800">{b.trialEndedNote}</dd>
                </div>
              )}
              {sub.currentPeriodEnd && sub.status !== "trialing" && (
                <div className="flex justify-between gap-4 py-2.5">
                  <dt className="text-zinc-500">{sub.provider === "manual" ? b.paidUntil(fmt(sub.currentPeriodEnd)) : sub.cancelAtPeriodEnd ? b.cancels(fmt(sub.currentPeriodEnd)) : b.renews(fmt(sub.currentPeriodEnd))}</dt>
                  <dd />
                </div>
              )}
              <div className="flex justify-between gap-4 py-2.5">
                <dt className="text-zinc-500">{b.price}</dt>
                <dd>
                  {plan ? priceOf(plan) : b.priceOnRequest}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-zinc-500">—</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {provider && sub?.providerCustomerId && provider.name !== "test" && (
              <form action={openBillingPortal}>
                <button className={buttonClass("secondary")}>{b.manage}</button>
              </form>
            )}
          </div>
          {canPay && status === "trialing" && <p className="mt-3 text-xs text-zinc-500">{b.trialNote}</p>}
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
      {offered.length > 0 && (
        <section aria-labelledby="plans-title" className="mt-8">
          <h2 id="plans-title" className="text-lg font-semibold">{b.plansTitle}</h2>
          <p className="mt-1 text-sm text-zinc-500">{b.plansSub}</p>
          <ul className={`mt-4 grid gap-4 ${offered.length >= 3 ? "lg:grid-cols-3" : "md:grid-cols-2"}`} data-testid="plan-list">
            {offered.map((p) => {
              const current = p.code === sub?.planCode;
              const features = (lang === "ar" && p.featuresAr.length ? p.featuresAr : p.features) ?? [];
              const description = (lang === "ar" && p.descriptionAr) || p.description;
              return (
                <li key={p.code} className={`flex flex-col rounded-xl border bg-white p-5 ${current ? "border-zinc-900" : "border-zinc-200"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold">{planName(p)}</p>
                    {current && <Badge tone="blue">{b.currentPlan}</Badge>}
                  </div>
                  {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
                  <p className="mt-3 text-sm font-medium">{priceOf(p)}</p>
                  {features.length > 0 && (
                    <ul className="mt-3 space-y-1 text-sm text-zinc-600">
                      {features.map((f) => (
                        <li key={f} className="flex gap-2">
                          <span aria-hidden>✓</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  )}
                  {canPay && p.priceCents != null ? (
                    // Pay for this plan online (a trial moves to it first).
                    <form action={startCheckout} className="mt-auto pt-4">
                      <input type="hidden" name="plan" value={p.code} />
                      <button className={buttonClass(p.featured || current ? "primary" : "secondary")} data-testid={`subscribe-${p.code}`}>
                        {b.subscribeTo(planName(p))}
                      </button>
                    </form>
                  ) : canRequest && !(manualActive && current) && p.priceCents != null ? (
                    // No online payment: pay by bank transfer (Operra activates the plan once confirmed).
                    <div className="mt-auto pt-4">
                      <Link
                        href={`/settings/billing/pay?plan=${p.code}`}
                        className={buttonClass(p.featured || current ? "primary" : "secondary")}
                        data-testid={`subscribe-${p.code}`}
                      >
                        {pending?.planCode === p.code && pending.transferredAt ? b.requestedShort : b.subscribeTo(planName(p))}
                      </Link>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
          {!canSwitch && sub?.providerSubscriptionId && <p className="mt-3 text-sm text-zinc-500">{b.paidPlanNote}</p>}
        </section>
      )}
      {paid.length > 0 && (
        <section aria-labelledby="invoices-title" className="mt-8">
          <h2 id="invoices-title" className="text-lg font-semibold">{b.invoicesTitle}</h2>
          <div className="mt-3 overflow-x-auto rounded-xl border border-zinc-200 bg-white">
            <table className="w-full min-w-[520px] text-sm" data-testid="invoices">
              <thead className="border-b border-zinc-200 text-start text-xs text-zinc-500">
                <tr>
                  {[b.invoiceNo, b.invoiceDate, b.plan, b.invoiceAmount, ""].map((h, i) => (
                    <th key={i} scope="col" className="px-4 py-2.5 text-start font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {paid.map((inv) => {
                  const p = offered.find((x) => x.code === inv.planCode);
                  return (
                    <tr key={inv.id}>
                      <td className="px-4 py-2.5 font-mono">{inv.number}</td>
                      <td className="px-4 py-2.5">{fmt(inv.createdAt)}</td>
                      <td className="px-4 py-2.5">{p ? planName(p) : inv.planCode}</td>
                      <td className="px-4 py-2.5 tabular-nums">{formatMoney(inv.amountCents, inv.currency, lang)}</td>
                      <td className="px-4 py-2.5 text-end">
                        {inv.url && (
                          <a href={inv.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                            {b.invoiceView}
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
