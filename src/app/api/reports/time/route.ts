import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { period, timeEntriesIn, toCsv } from "@/lib/reports";
import { hoursOf } from "@/lib/time";

/** GET /api/reports/time?from=&to= — time entries as CSV (admins). */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !can(user, "reports.view")) return new Response("Not found", { status: 404 });
  const p = period(request.nextUrl.searchParams.get("from"), request.nextUrl.searchParams.get("to"));
  const rows = await timeEntriesIn(user.orgId, p);
  const csv = toCsv([
    ["Date", "Person", "Client", "Project", "Task", "Hours", "Minutes", "Note"],
    ...rows.map((r) => [r.spentOn, r.person ?? "", r.client, r.project, r.task, hoursOf(r.minutes), r.minutes, r.note ?? ""]),
  ]);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="time-${p.from}-to-${p.to}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
