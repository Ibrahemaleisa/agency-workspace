import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { TASK_STATUSES } from "@/lib/constants";
import { listInternalUsers, listTasks, type TaskFilter } from "@/server/queries";
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
  if (status && TASK_STATUSES.some((s) => s.value === status)) filter.status = status;
  else if (!filter.status && view !== "overdue" && view !== "today") filter.status = "open";
  if (assignee) filter.assigneeId = assignee === "none" ? null : assignee;

  const [tasks, people] = await Promise.all([listTasks(user, filter), listInternalUsers(user.orgId)]);
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
          hrefFor={(v) => `/tasks?view=${v}`}
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
          <SearchBox defaultValue={q} placeholder={t.tasks.searchPlaceholder} hidden={{ view, status, assignee }} />
        </div>
      </div>
      <Card padded={false}>
        <TaskTable tasks={tasks} editableStatus showAssignee={view !== "mine"} empty={t.tasks.empty} />
      </Card>
    </>
  );
}
