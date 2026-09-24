import { format, isToday, parseISO } from "date-fns";
import type { Priority, ProjectStatus, TaskStatus } from "@/db/schema";
import { PRIORITIES, PROJECT_STATUSES, TASK_STATUSES } from "@/lib/constants";
import { getT } from "@/lib/lang";
import { Avatar, Badge, cn, isOverdue } from "./ui";

/** Server-only, translated labels (status, priority, people, dates). */

export async function StatusBadge({ status }: { status: TaskStatus }) {
  const { t } = await getT();
  const s = TASK_STATUSES.find((x) => x.value === status)!;
  return (
    <Badge tone={s.tone} dot>
      {t.taskStatus[status]}
    </Badge>
  );
}

export async function PriorityBadge({ priority }: { priority: Priority }) {
  const { t } = await getT();
  const p = PRIORITIES.find((x) => x.value === priority)!;
  if (priority === "medium" || priority === "low")
    return <span className="text-xs text-zinc-500">{t.priority[priority]}</span>;
  return <Badge tone={p.tone}>{t.priority[priority]}</Badge>;
}

export async function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const { t } = await getT();
  const s = PROJECT_STATUSES.find((x) => x.value === status)!;
  return (
    <Badge tone={s.tone} dot>
      {t.projectStatus[status]}
    </Badge>
  );
}

export async function ApprovalBadge({ status }: { status: string }) {
  const { t } = await getT();
  if (status === "pending") return <Badge tone="amber">{t.approval.pending}</Badge>;
  if (status === "approved") return <Badge tone="green">{t.approval.approved}</Badge>;
  if (status === "rejected") return <Badge tone="red">{t.approval.rejected}</Badge>;
  return null;
}

export async function Person({ name }: { name?: string | null }) {
  const { t } = await getT();
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <Avatar name={name} size="xs" />
      <span className={cn("truncate text-sm", name ? "text-zinc-700" : "text-zinc-400")}>
        {name ?? t.common.unassigned}
      </span>
    </span>
  );
}

export async function DueDate({ date, status }: { date: string | null; status?: TaskStatus }) {
  if (!date) return <span className="text-xs text-zinc-400">—</span>;
  const { t, locale } = await getT();
  const d = parseISO(date);
  const overdue = isOverdue(date, status);
  const today = isToday(d) && status !== "completed";
  return (
    <span
      className={cn(
        "whitespace-nowrap text-xs tabular-nums",
        overdue ? "font-medium text-red-600" : today ? "font-medium text-amber-700" : "text-zinc-600",
      )}
    >
      {overdue ? `${t.common.overdue} · ` : today ? `${t.common.today} · ` : ""}
      {format(d, "MMM d", { locale })}
    </span>
  );
}
