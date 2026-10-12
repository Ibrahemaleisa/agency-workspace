import "server-only";
import { addDays, addMonths, addWeeks, format, parseISO } from "date-fns";
import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { checklistItems, projectModules, tasks, RECURRENCES, type Recurrence } from "@/db/schema";
import type { SessionUser } from "./auth";
import { logActivity, notify } from "./events";
import { nt } from "./notify-text";

export const parseRecurrence = (v: string | null | undefined): Recurrence | null =>
  v && (RECURRENCES as readonly string[]).includes(v) ? (v as Recurrence) : null;

/** The next due date: one interval after the previous one (or after today when there was none). */
export function nextDueDate(previous: string | null, recurrence: Recurrence, today = new Date()) {
  const base = previous ? parseISO(previous) : today;
  let next = recurrence === "daily" ? addDays(base, 1) : recurrence === "weekly" ? addWeeks(base, 1) : addMonths(base, 1);
  // A task completed late doesn't create one that's already overdue: catch up to today or later.
  while (format(next, "yyyy-MM-dd") < format(today, "yyyy-MM-dd")) {
    next = recurrence === "daily" ? addDays(next, 1) : recurrence === "weekly" ? addWeeks(next, 1) : addMonths(next, 1);
  }
  return format(next, "yyyy-MM-dd");
}

/**
 * When a repeating task is completed, creates the next one (once: the original remembers it).
 * Same project, module, assignee, priority, sharing and approval rule; first workflow stage;
 * checklist copied unticked.
 */
export async function spawnNextIfRecurring(actor: SessionUser, taskId: string) {
  const task = await db.query.tasks.findFirst({ where: eq(tasks.id, taskId) });
  if (!task?.recurrence || task.nextTaskId || task.status !== "completed") return null;
  const mod = task.moduleId ? await db.query.projectModules.findFirst({ where: eq(projectModules.id, task.moduleId) }) : null;
  const dueDate = nextDueDate(task.dueDate, task.recurrence);

  const next = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(tasks)
      .values({
        orgId: task.orgId,
        projectId: task.projectId,
        moduleId: task.moduleId,
        stage: mod?.stages[0]?.name ?? null,
        title: task.title,
        description: task.description,
        assigneeId: task.assigneeId,
        priority: task.priority,
        dueDate,
        clientVisible: task.clientVisible,
        requiresApproval: task.requiresApproval,
        recurrence: task.recurrence,
        createdById: task.createdById,
      })
      .returning();
    // Claim the round: if another request got here first, undo ours.
    const [claimed] = await tx
      .update(tasks)
      .set({ nextTaskId: created.id })
      .where(and(eq(tasks.id, task.id), isNull(tasks.nextTaskId)))
      .returning({ id: tasks.id });
    if (!claimed) {
      tx.rollback();
    }
    const steps = await tx.select().from(checklistItems).where(eq(checklistItems.taskId, task.id)).orderBy(asc(checklistItems.position));
    if (steps.length) {
      await tx.insert(checklistItems).values(steps.map((s) => ({ orgId: s.orgId, taskId: created.id, title: s.title, position: s.position })));
    }
    return created;
  }).catch(() => null);
  if (!next) return null;

  await logActivity(actor, {
    action: "task.recurred",
    summary: `next "${task.title}" is due ${dueDate}`,
    params: { title: task.title, due: dueDate },
    projectId: task.projectId,
    taskId: next.id,
  });
  if (next.assigneeId && next.assigneeId !== actor.id) {
    await notify(actor, [next.assigneeId], { type: "assigned", title: nt.assigned(actor.name, next.title), link: `/tasks/${next.id}` });
  }
  return next;
}
