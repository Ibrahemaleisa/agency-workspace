import "server-only";
import { appUrl } from "./app-links";

/** A plan as the Operra app publishes it (GET {app}/api/plans), managed in the control center. */
export type LivePlan = {
  code: string;
  name: { en: string; ar: string };
  description: { en: string; ar: string };
  features: { en: string[]; ar: string[] };
  featured: boolean;
  price: null | { amount: number; currency: string; interval: string };
  trialDays: number;
};

/** The plans on offer right now, or null when the app isn't configured or can't be reached. */
export async function getLivePlans(): Promise<LivePlan[] | null> {
  if (!appUrl) return null;
  try {
    const res = await fetch(`${appUrl}/api/plans`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = (await res.json()) as LivePlan[];
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

export function formatPrice(price: NonNullable<LivePlan["price"]>, locale: string) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en", {
    style: "currency",
    currency: price.currency,
    maximumFractionDigits: Number.isInteger(price.amount) ? 0 : 2,
  }).format(price.amount);
}
