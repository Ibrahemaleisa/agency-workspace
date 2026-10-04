import { timingSafeEqual } from "node:crypto";
import { resetDemoData } from "@/db/demo-data";

/**
 * GET /api/cron/reset-demo — nightly reset of the PUBLIC DEMO back to the sample workspace
 * (scheduled in vercel.json), so visitors' changes to the brand, users and data don't pile up.
 *
 * This repo deploys to every customer, and the reset wipes the database, so it only runs when
 * the deployment is explicitly marked as the demo (all three variables) and Vercel Cron's
 * secret matches. Everywhere else it answers 404 and touches nothing.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const isDemoDeployment = () =>
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
  await resetDemoData();
  return Response.json({ ok: true, resetAt: new Date().toISOString() });
}
