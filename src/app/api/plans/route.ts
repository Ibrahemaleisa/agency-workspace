import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { plans } from "@/db/schema";
import { isPlatform } from "@/lib/platform";

export const dynamic = "force-dynamic";

/** Public list of the plans on offer, for the marketing site's pricing page (and anyone else). */
export async function GET() {
  if (!isPlatform()) return new Response(null, { status: 404 });
  const rows = await db.select().from(plans).where(eq(plans.active, true)).orderBy(asc(plans.sort), asc(plans.code));
  const body = rows.map((p) => ({
    code: p.code,
    name: { en: p.name, ar: p.nameAr || p.name },
    description: { en: p.description ?? "", ar: p.descriptionAr || p.description || "" },
    features: { en: p.features, ar: p.featuresAr.length ? p.featuresAr : p.features },
    featured: p.featured,
    price: p.priceCents == null ? null : { amount: p.priceCents / 100, currency: p.currency, interval: p.interval },
    trialDays: p.trialDays,
  }));
  return Response.json(body, {
    headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}
