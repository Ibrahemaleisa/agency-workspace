import { asc } from "drizzle-orm";
import { db } from "@/db";
import { plans } from "@/db/schema";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { updatePlan } from "@/server/platform-admin-actions";
import { ControlHeader } from "@/components/platform/control-header";
import { ActionForm, SubmitButton } from "@/components/forms";

const field = "mt-1 block w-full rounded-md border border-[#8C919A] bg-white px-2.5 py-1.5 text-sm";
const label = "block text-xs font-medium text-[#5A606B]";

/** Plans: the single place for trial length and prices (no deploy needed). */
export default async function PlansPage() {
  const admin = await requirePlatformAdmin();
  const rows = await db.select().from(plans).orderBy(asc(plans.sort), asc(plans.code));
  return (
    <>
      <ControlHeader name={admin.name} />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">Plans</h1>
        <p className="mt-1 max-w-2xl text-sm text-[#5A606B]">
          Trial length and prices live here. Changes apply to new sign-ups and new checkouts; running trials keep their end date.
          Leave the display price blank until pricing is agreed — the app then shows “priced on request”. Stripe charges its own
          Price; put its ID here (or in <code className="font-mono">STRIPE_PRICE_&lt;CODE&gt;</code>).
        </p>
        <ul className="mt-6 space-y-4">
          {rows.map((p) => (
            <li key={p.code} className="rounded-lg border border-[#E3E4E0] bg-white p-5">
              <p className="font-mono text-xs text-[#5A606B]">{p.code}</p>
              <ActionForm action={updatePlan} successMessage="Saved." className="mt-3 grid gap-4 sm:grid-cols-3">
                <input type="hidden" name="code" value={p.code} />
                <label className={label}>
                  Name
                  <input name="name" defaultValue={p.name} required className={field} />
                </label>
                <label className={label}>
                  Free trial (days)
                  <input name="trialDays" type="number" min={0} max={90} defaultValue={p.trialDays} required className={field} data-testid={`trial-days-${p.code}`} />
                </label>
                <label className={label}>
                  Stripe price ID
                  <input name="stripePriceId" defaultValue={p.stripePriceId ?? ""} placeholder="price_…" className={`${field} font-mono`} />
                </label>
                <label className={label}>
                  Display price (blank = not published)
                  <input name="price" type="number" min={0} step="0.01" defaultValue={p.priceCents == null ? "" : p.priceCents / 100} className={field} />
                </label>
                <label className={label}>
                  Currency
                  <input name="currency" defaultValue={p.currency} maxLength={3} className={`${field} uppercase`} />
                </label>
                <label className={label}>
                  Billed every
                  <select name="interval" defaultValue={p.interval} className={field}>
                    <option value="month">month</option>
                    <option value="year">year</option>
                  </select>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="active" defaultChecked={p.active} /> Available for new sign-ups
                </label>
                <div className="sm:col-span-3">
                  <SubmitButton>Save plan</SubmitButton>
                </div>
              </ActionForm>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
