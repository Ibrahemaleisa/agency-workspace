import { sql } from "drizzle-orm";
import { db } from "@/db";

export const dynamic = "force-dynamic";

/** GET /api/health — liveness plus a database round trip, for uptime monitors. Reveals nothing else. */
export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true, db: "up" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ ok: false, db: "down" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
