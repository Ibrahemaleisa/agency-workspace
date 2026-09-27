import type { NextRequest } from "next/server";
import { VISITOR_RE, requestCountry, track } from "@/lib/analytics";
import { isPlatform } from "@/lib/platform";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";

const clip = (v: unknown, max: number) => (typeof v === "string" && v ? v.slice(0, max) : undefined);

/**
 * POST /api/t — page views from the Operra marketing site (navigator.sendBeacon, text/plain JSON,
 * so no CORS preflight). Records only: visitor id, path, referrer host, UTM source, language, country.
 */
export async function POST(request: NextRequest) {
  if (!isPlatform()) return new Response(null, { status: 404 });
  if (!(await rateLimit(`t:${await clientIp()}`, 120, 3600))) return new Response(null, { status: 204 });

  let body: Record<string, unknown>;
  try {
    const text = await request.text();
    if (text.length > 2000) return new Response(null, { status: 413 });
    body = JSON.parse(text);
  } catch {
    return new Response(null, { status: 400 });
  }
  const vid = typeof body.vid === "string" && VISITOR_RE.test(body.vid) ? body.vid : null;
  const path = clip(body.path, 300);
  if (!vid || !path?.startsWith("/")) return new Response(null, { status: 400 });

  let ref: string | undefined;
  try {
    ref = typeof body.ref === "string" && body.ref ? new URL(body.ref).host.slice(0, 120) : undefined;
  } catch {
    ref = undefined;
  }
  const meta: Record<string, string> = {};
  if (ref) meta.ref = ref;
  const utm = clip(body.utm, 80);
  if (utm) meta.utm = utm;
  const lang = body.lang === "ar" || body.lang === "en" ? body.lang : undefined;
  if (lang) meta.lang = lang;

  await track("site_view", { visitorId: vid, path, country: await requestCountry(), meta });
  return new Response(null, { status: 204 });
}
