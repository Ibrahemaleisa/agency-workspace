import { timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { resetDemoDatabase } from "@/db/demo-data";
import { isPlatform } from "@/lib/platform";

/**
 * GET /api/cron/reset-demo — nightly reset of the SHARED PUBLIC DEMO back to Northwind Studio
 * (vercel.json → crons), so visitors' changes to the brand, users and data don't pile up.
 *
 * Every project built from this repo gets the cron, and the reset wipes the database, so it only
 * acts when the deployment is explicitly marked as the demo (DEMO_RESET, SEED_DEMO and
 * SHOW_DEMO_ACCOUNTS all "true"), is not the Operra platform, and Vercel Cron's secret matches.
 * Everywhere else it answers 404 and touches nothing.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const isDemoDeployment = () =>
  !isPlatform() &&
  process.env.DEMO_RESET === "true" &&
  process.env.SEED_DEMO === "true" &&
  process.env.SHOW_DEMO_ACCOUNTS === "true";

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function GET(req: Request) {
  if (!isDemoDeployment()) return new Response("Not found", { status: 404 });
  if (!authorized(req)) return new Response("Unauthorized", { status: 401 });
  await resetDemoDatabase(await bcrypt.hash("password", 10));
  return Response.json({ ok: true, resetAt: new Date().toISOString() });
}
