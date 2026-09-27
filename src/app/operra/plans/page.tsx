import { asc } from "drizzle-orm";
import { db } from "@/db";
import { plans, type Plan } from "@/db/schema";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { DEFAULT_TRIAL_DAYS } from "@/lib/billing/defaults";
import { createPlan, updatePlan } from "@/server/platform-admin-actions";
import { ControlHeader } from "@/components/platform/control-header";
import { ActionForm, SubmitButton } from "@/components/forms";

const field = "mt-1 block w-full rounded-md border border-[#8C919A] bg-white px-2.5 py-1.5 text-sm";
const label = "block text-xs font-medium text-[#5A606B]";

/** The editable fields of a plan (new or existing). */
function PlanFields({ p }: { p?: Plan }) {
  return (
    <>
      <label className={label}>
        Name (English)
        <input name="name" defaultValue={p?.name ?? ""} required className={field} />
      </label>
      <label className={label}>
        Name (Arabic)
        <input name="nameAr" defaultValue={p?.nameAr ?? ""} dir="rtl" className={field} />
      </label>
      <label className={label}>
        Order on the pricing page
        <input name="sort" type="number" min={-100} max={100} defaultValue={p?.sort ?? 0} className={field} />
      </label>
      <label className={`${label} sm:col-span-3 lg:col-span-1`}>
        One-line description (English)
        <input name="description" defaultValue={p?.description ?? ""} className={field} />
      </label>
      <label className={`${label} sm:col-span-3 lg:col-span-2`}>
        One-line description (Arabic)
        <input name="descriptionAr" defaultValue={p?.descriptionAr ?? ""} dir="rtl" className={field} />
      </label>
      <label className={`${label} sm:col-span-3 lg:col-span-1`}>
        What’s included (English, one per line)
        <textarea name="features" rows={5} defaultValue={(p?.features ?? []).join("\n")} className={field} />
      </label>
      <label className={`${label} sm:col-span-3 lg:col-span-2`}>
        What’s included (Arabic, one per line)
        <textarea name="featuresAr" rows={5} defaultValue={(p?.featuresAr ?? []).join("\n")} dir="rtl" className={field} />
      </label>
      <label className={label}>
        Free trial (days)
        <input name="trialDays" type="number" min={0} max={90} defaultValue={p?.trialDays ?? DEFAULT_TRIAL_DAYS} required className={field} data-testid={p ? `trial-days-${p.code}` : undefined} />
      </label>
      <label className={label}>
        Display price (blank = not published)
        <input name="price" type="number" min={0} step="0.01" defaultValue={p?.priceCents == null ? "" : p.priceCents / 100} className={field} />
      </label>
      <label className={label}>
        Currency
        <input name="currency" defaultValue={p?.currency ?? "SAR"} maxLength={3} className={`${field} uppercase`} />
      </label>
      <label className={label}>
        Billed every
        <select name="interval" defaultValue={p?.interval ?? "month"} className={field}>
          <option value="month">month</option>
          <option value="year">year</option>
        </select>
      </label>
      <label className={label}>
        Payment provider ID (Lemon Squeezy variant or Stripe price)
        <input name="stripePriceId" defaultValue={p?.stripePriceId ?? ""} placeholder="123456 or price_…" className={`${field} font-mono`} />
      </label>
      <div className="flex flex-col justify-end gap-2 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="active" defaultChecked={p?.active ?? true} /> Shown and available for sign-up
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="featured" defaultChecked={p?.featured ?? false} /> Recommended
        </label>
      </div>
    </>
  );
}

/** Plans: names, what's included, trial length and prices — shown on the website, sign-up and billing (no deploy needed). */
export default async function PlansPage() {
  const admin = await requirePlatformAdmin();
  const rows = await db.select().from(plans).orderBy(asc(plans.sort), asc(plans.code));
  return (
    <>
      <ControlHeader name={admin.name} />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">Plans</h1>
        <p className="mt-1 max-w-3xl text-sm text-[#5A606B]">
          Every plan marked “shown” appears on the website’s pricing page, in sign-up and on each agency’s billing page, in English
          and Arabic. Changes apply within a few minutes, to new sign-ups and new checkouts; running trials keep their end date.
          Leave the display price blank to show “priced on request”. Stripe charges its own Price; put its ID here (or in{" "}
          <code className="font-mono">STRIPE_PRICE_&lt;CODE&gt;</code>).
        </p>
        <ul className="mt-6 space-y-4">
          {rows.map((p) => (
            <li key={p.code} className="rounded-lg border border-[#E3E4E0] bg-white p-5">
              <p className="font-mono text-xs text-[#5A606B]">
                {p.code}
                {!p.active && " · hidden"}
                {p.featured && " · recommended"}
              </p>
              <ActionForm action={updatePlan} successMessage="Saved." className="mt-3 grid gap-4 sm:grid-cols-3">
                <input type="hidden" name="code" value={p.code} />
                <PlanFields p={p} />
                <div className="sm:col-span-3">
                  <SubmitButton>Save plan</SubmitButton>
                </div>
              </ActionForm>
            </li>
          ))}
        </ul>

        <section aria-labelledby="new-plan" className="mt-10 rounded-lg border border-dashed border-[#8C919A] bg-white p-5">
          <h2 id="new-plan" className="text-lg font-semibold">Add a plan</h2>
          <ActionForm action={createPlan} successMessage="Plan added." className="mt-3 grid gap-4 sm:grid-cols-3">
            <label className={label}>
              Code (permanent, used in links)
              <input name="code" required pattern="[a-z][a-z0-9\-]{1,30}" placeholder="growth" className={`${field} font-mono`} />
            </label>
            <PlanFields />
            <div className="sm:col-span-3">
              <SubmitButton>Add plan</SubmitButton>
            </div>
          </ActionForm>
        </section>
      </main>
    </>
  );
}
