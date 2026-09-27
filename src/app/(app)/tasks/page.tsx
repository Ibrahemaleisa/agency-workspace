import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { TASK_STATUSES } from "@/lib/constants";
import { listInternalUsers, listTasks, todayISO, type TaskFilter } from "@/server/queries";
import { updateTaskStatus } from "@/server/task-actions";
import { TaskBoard } from "@/components/task-board";
import Link from "next/link";
import { LayoutList, Columns3 } from "lucide-react";
import { TaskTable } from "@/components/lists";
import { FilterTabs, SearchBox } from "@/components/filters";
import { AutoSubmitSelect } from "@/components/forms";
import { Card, PageHeader } from "@/components/ui";
import type { TaskStatus } from "@/db/schema";
import { getT } from "@/lib/lang";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t.tasks.title };
}

const VIEWS = ["mine", "all", "today", "overdue", "blocked", "unassigned"] as const;

/** On the board, completed work stays visible for two weeks. */
function withoutOldCompleted<T extends { status: string; updatedAt: Date }>(list: T[]) {
  const cutoff = Date.now() - 14 * 86_400_000;
  return list.filter((x) => x.status !== "completed" || x.updatedAt.getTime() > cutoff);
}

export default async function TasksPage({ searchParams }: PageProps<"/tasks">) {
  const user = await requirePermission("tasks.updateStatus");
  const { t } = await getT();
  const sp = await searchParams;
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);

  const status = get("status") as TaskStatus | undefined;
  const assignee = get("assignee");
  const q = get("q");
  const view = get("view") ?? (status || assignee ? "all" : user.role === "admin" ? "all" : "mine");

  const filter: TaskFilter = { q };
  if (view === "mine") filter.assigneeId = user.id;
  if (view === "today") filter.dueToday = true;
  if (view === "overdue") filter.overdue = true;
  if (view === "blocked") filter.status = "waiting_client";
  if (view === "unassigned") filter.assigneeId = null;
  const board = get("layout") === "board";
  if (status && TASK_STATUSES.some((s) => s.value === status)) filter.status = status;
  // The board shows every status (completed as its own column); the list shows open work by default.
  else if (!filter.status && view !== "overdue" && view !== "today" && !board) filter.status = "open";
  if (assignee) filter.assigneeId = assignee === "none" ? null : assignee;

  const [allTasks, people] = await Promise.all([listTasks(user, filter), listInternalUsers(user.orgId)]);
  const tasks = board ? withoutOldCompleted(allTasks) : allTasks;
  const layoutHref = (l: "list" | "board") => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ view: get("view"), status, assignee, q })) if (v) p.set(k, v);
    if (l === "board") p.set("layout", "board");
    const qs = p.toString();
    return `/tasks${qs ? `?${qs}` : ""}`;
  };
  const assigneeName = assignee === "none" ? t.taskFilter.unassigned : assignee ? people.find((p) => p.id === assignee)?.name : undefined;
  const canFilterAssignee = can(user, "tasks.assign");

  return (
    <>
      <PageHeader
        title={t.tasks.title}
        description={
          assigneeName
            ? t.tasks.assignedTo(assigneeName)
            : status && status in t.taskStatus
              ? t.tasks.withStatus(t.taskStatus[status])
              : t.tasks.subtitle
        }
      />
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <FilterTabs
          current={assignee || status ? "" : view}
          options={VIEWS.filter((v) => v !== "unassigned" || can(user, "tasks.assign")).map((v) => ({ value: v, label: t.tasks.views[v] }))}
          hrefFor={(v) => `/tasks?view=${v}${board ? "&layout=board" : ""}`}
        />
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          {canFilterAssignee && (
            <form className="w-full sm:w-52">
              {q && <input type="hidden" name="q" value={q} />}
              {status && <input type="hidden" name="status" value={status} />}
              <input type="hidden" name="view" value="all" />
              <AutoSubmitSelect
                name="assignee"
                aria-label={t.taskFilter.assignee}
                defaultValue={assignee ?? ""}
                className="rounded-full py-2"
                options={[
                  { value: "", label: `${t.taskFilter.assignee}: ${t.taskFilter.everyone}` },
                  { value: "none", label: t.taskFilter.unassigned },
                  ...people.map((p) => ({ value: p.id, label: p.name })),
                ]}
              />
            </form>
          )}
          <SearchBox defaultValue={q} placeholder={t.tasks.searchPlaceholder} hidden={{ view, status, assignee, layout: board ? "board" : undefined }} />
          <nav aria-label={t.tasks.layoutLabel} className="flex rounded-full border border-zinc-200 bg-white p-0.5 text-sm">
            {(["list", "board"] as const).map((l) => {
              const Icon = l === "list" ? LayoutList : Columns3;
              const active = (l === "board") === board;
              return (
                <Link
                  key={l}
                  href={layoutHref(l)}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 ${active ? "bg-zinc-900 text-white" : "text-zinc-600 hover:text-zinc-900"}`}
                  data-testid={`layout-${l}`}
                >
                  <Icon aria-hidden className="size-4" />
                  {t.tasks.layouts[l]}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      {board ? (
        <TaskBoard
          columns={TASK_STATUSES.map((c) => ({ value: c.value, label: t.taskStatus[c.value], tone: c.tone }))}
          tasks={tasks.map((x) => ({
            id: x.id,
            title: x.title,
            status: x.status,
            priority: x.priority,
            dueDate: x.dueDate,
            projectName: x.projectName,
            clientName: x.clientName,
            assigneeName: x.assigneeName,
            moduleColor: x.moduleColor,
          }))}
          move={updateTaskStatus}
          canMove={!user.readOnly}
          today={todayISO()}
          labels={{ moveTo: t.tasks.moveTo, empty: t.tasks.columnEmpty, overdue: t.tasks.views.overdue, unassigned: t.taskFilter.unassigned }}
        />
      ) : (
        <Card padded={false}>
          <TaskTable tasks={tasks} editableStatus showAssignee={view !== "mine"} empty={t.tasks.empty} />
        </Card>
      )}
    </>
  );
}
