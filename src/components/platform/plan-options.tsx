import type { Plan } from "@/db/schema";

export type PlanLabels = { perMonth: string; perYear: string; onRequest: string; recommended: string };

/** A plan's name, description and features in the reader's language (Arabic falls back to English). */
export function planText(p: Plan, lang: string) {
  const ar = lang === "ar";
  return {
    name: (ar && p.nameAr) || p.name,
    description: (ar && p.descriptionAr) || p.description || "",
    features: ar && p.featuresAr.length ? p.featuresAr : p.features,
  };
}

export function planPrice(p: Pick<Plan, "priceCents" | "currency" | "interval">, lang: string, l: Pick<PlanLabels, "perMonth" | "perYear" | "onRequest">) {
  if (p.priceCents == null) return l.onRequest;
  const amount = new Intl.NumberFormat(lang === "ar" ? "ar-SA" : "en", {
    style: "currency",
    currency: p.currency,
    maximumFractionDigits: p.priceCents % 100 ? 2 : 0,
  }).format(p.priceCents / 100);
  return `${amount} / ${p.interval === "year" ? l.perYear : l.perMonth}`;
}

/** Plan cards as radio buttons (name="plan"), for sign-up. */
export function PlanOptions({ plans, lang, labels, defaultCode }: { plans: Plan[]; lang: string; labels: PlanLabels; defaultCode?: string }) {
  const checked = plans.some((p) => p.code === defaultCode) ? defaultCode : (plans.find((p) => p.featured) ?? plans[0])?.code;
  return (
    <div className={`grid gap-3 ${plans.length > 1 ? "sm:grid-cols-2" : ""}`} data-testid="plan-options">
      {plans.map((p) => {
        const t = planText(p, lang);
        return (
          <label
            key={p.code}
            className="flex cursor-pointer flex-col rounded-xl border border-zinc-300 bg-white p-4 has-checked:border-zinc-900 has-checked:ring-1 has-checked:ring-zinc-900"
          >
            <span className="flex items-start gap-3">
              <input type="radio" name="plan" value={p.code} defaultChecked={p.code === checked} className="mt-1" />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{t.name}</span>
                  {p.featured && <span className="rounded bg-zinc-900 px-1.5 py-0.5 text-[11px] font-medium text-white">{labels.recommended}</span>}
                </span>
                <span className="mt-0.5 block text-sm font-medium">{planPrice(p, lang, labels)}</span>
                {t.description && <span className="mt-0.5 block text-sm text-zinc-500">{t.description}</span>}
              </span>
            </span>
            {t.features.length > 0 && (
              <ul className="mt-3 space-y-1 ps-7 text-sm text-zinc-600">
                {t.features.slice(0, 4).map((f) => (
                  <li key={f} className="flex gap-2">
                    <span aria-hidden>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            )}
          </label>
        );
      })}
    </div>
  );
}
