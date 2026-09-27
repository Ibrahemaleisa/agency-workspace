import type { Plan } from "@/db/schema";

/** A plan's name, description and features in the reader's language (Arabic falls back to English). */
export function planText(p: Plan, lang: string) {
  const ar = lang === "ar";
  return {
    name: (ar && p.nameAr) || p.name,
    description: (ar && p.descriptionAr) || p.description || "",
    features: ar && p.featuresAr.length ? p.featuresAr : p.features,
  };
}

export function planPrice(p: Pick<Plan, "priceCents" | "currency" | "interval">, lang: string, l: { perMonth: string; perYear: string; onRequest: string }) {
  if (p.priceCents == null) return l.onRequest;
  const amount = new Intl.NumberFormat(lang === "ar" ? "ar-SA-u-nu-latn" : "en", {
    style: "currency",
    currency: p.currency,
    maximumFractionDigits: p.priceCents % 100 ? 2 : 0,
  }).format(p.priceCents / 100);
  return `${amount} / ${p.interval === "year" ? l.perYear : l.perMonth}`;
}
