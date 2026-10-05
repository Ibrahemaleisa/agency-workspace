import type { Plan } from "@/db/schema";
import { activatePlanAction } from "@/server/platform-admin-actions";
import { ActionForm, SubmitButton } from "@/components/forms";

const field = "rounded-md border border-[#8D929C] bg-white px-2 py-1.5 text-sm";

/**
 * Staff: activate (or renew) a plan after the agency paid. Months add to a running manual plan.
 * Amount blank = the plan's price × months; it becomes the invoice amount.
 */
export function ActivatePlanForm({
  orgId,
  plans,
  defaultPlan,
  defaultMonths = 1,
  defaultAmount,
  compact,
}: {
  orgId: string;
  plans: Plan[];
  defaultPlan?: string;
  defaultMonths?: number;
  /** Pre-filled from a declared transfer (major units). */
  defaultAmount?: number;
  compact?: boolean;
}) {
  return (
    <ActionForm action={activatePlanAction} successMessage="Activated — invoice recorded." className={`flex flex-wrap items-end gap-2 ${compact ? "" : "mt-4"}`}>
      <input type="hidden" name="orgId" value={orgId} />
      <label className="text-xs text-[#5B606B]">
        Plan
        <select name="plan" defaultValue={defaultPlan} className={`${field} mt-1 block`}>
          {plans.map((p) => (
            <option key={p.code} value={p.code}>
              {p.name}
              {p.priceCents != null ? ` — ${p.priceCents / 100} ${p.currency}/${p.interval}` : ""}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs text-[#5B606B]">
        Months paid
        <select name="months" defaultValue={String(defaultMonths)} className={`${field} mt-1 block`}>
          {[1, 3, 6, 12].map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </label>
      <label className="text-xs text-[#5B606B]">
        Amount received (blank = plan price)
        <input name="amount" type="number" min={0} step="0.01" defaultValue={defaultAmount} className={`${field} mt-1 block w-36`} />
      </label>
      <SubmitButton size="sm">Activate plan</SubmitButton>
    </ActionForm>
  );
}
