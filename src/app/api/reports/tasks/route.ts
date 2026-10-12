import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { allTasks, toCsv } from "@/lib/reports";
import { hoursOf } from "@/lib/time";

/** GET /api/reports/tasks — every task of the workspace as CSV (admins). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || !can(user, "reports.view")) return new Response("Not found", { status: 404 });
  const rows = await allTasks(user.orgId);
  const day = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");
  const csv = toCsv([
    ["Task", "Client", "Project", "Assignee", "Status", "Priority", "Due", "Completed", "Created", "Client approval", "Shared with client", "Hours logged"],
    ...rows.map((r) => [
      r.title,
      r.client,
      r.project,
      r.assignee ?? "",
      r.status,
      r.priority,
      r.dueDate ?? "",
      day(r.completedAt),
      day(r.createdAt),
      r.approval,
      r.sharedWithClient ? "yes" : "no",
      hoursOf(r.minutes),
    ]),
  ]);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tasks-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
