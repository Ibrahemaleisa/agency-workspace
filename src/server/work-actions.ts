"use server";

import { revalidatePath } from "next/cache";
import { and, eq, max } from "drizzle-orm";
import { db } from "@/db";
import { checklistItems, timeEntries, users } from "@/db/schema";
import { hashToken, newToken, requireUser } from "@/lib/auth";
import { getAccessibleTask } from "@/lib/access";
import { assertCan, ForbiddenError } from "@/lib/permissions";
import { logActivity } from "@/lib/events";
import { idOf, str, type ActionState } from "@/lib/action-state";
import { getT } from "@/lib/lang";
import { appUrl, tenantBaseUrl } from "@/lib/platform";
import { getOrgById } from "@/lib/tenant";
import { formatMinutes } from "@/lib/time";

const taskPath = (id: string) => `/tasks/${id}`;

/* ------------------------------------------------------------------ */
/* Checklist                                                           */
/* ------------------------------------------------------------------ */

export async function addChecklistItem(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  assertCan(user, "tasks.edit");
  const { task } = await getAccessibleTask(user, idOf(fd, "taskId"));
  const title = str(fd, "title")?.slice(0, 300);
  if (!title) return { error: (await getT()).t.lifecycle.errors.empty };
  const [{ last }] = await db.select({ last: max(checklistItems.position) }).from(checklistItems).where(eq(checklistItems.taskId, task.id));
  await db.insert(checklistItems).values({ orgId: user.orgId, taskId: task.id, title, position: (last ?? -1) + 1 });
  revalidatePath(taskPath(task.id));
  return { ok: true };
}

/** Anyone who can move the task along can tick its steps. */
export async function toggleChecklistItem(fd: FormData) {
  const user = await requireUser();
  assertCan(user, "tasks.updateStatus");
  const item = await db.query.checklistItems.findFirst({
    where: and(eq(checklistItems.id, idOf(fd, "itemId")), eq(checklistItems.orgId, user.orgId)),
  });
  if (!item) return;
  await getAccessibleTask(user, item.taskId);
  const done = !item.done;
  await db.update(checklistItems).set({ done, doneById: done ? user.id : null }).where(eq(checklistItems.id, item.id));
  revalidatePath(taskPath(item.taskId));
}

export async function removeChecklistItem(fd: FormData) {
  const user = await requireUser();
  assertCan(user, "tasks.edit");
  const item = await db.query.checklistItems.findFirst({
    where: and(eq(checklistItems.id, idOf(fd, "itemId")), eq(checklistItems.orgId, user.orgId)),
  });
  if (!item) return;
  await getAccessibleTask(user, item.taskId);
  await db.delete(checklistItems).where(eq(checklistItems.id, item.id));
  revalidatePath(taskPath(item.taskId));
}

/* ------------------------------------------------------------------ */
/* Time tracking                                                       */
/* ------------------------------------------------------------------ */

export async function logTime(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  assertCan(user, "time.log");
  const { task } = await getAccessibleTask(user, idOf(fd, "taskId"));
  const e = (await getT()).t.time.errors;
  const hours = Number(str(fd, "hours") ?? 0);
  const mins = Number(str(fd, "minutes") ?? 0);
  const minutes = Math.round((Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(mins) ? mins : 0));
  if (minutes <= 0 || minutes > 24 * 60) return { error: e.amount };
  const spentOn = str(fd, "spentOn") ?? new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(spentOn) || Number.isNaN(Date.parse(spentOn))) return { error: e.date };
  await db.insert(timeEntries).values({
    orgId: user.orgId,
    taskId: task.id,
    projectId: task.projectId,
    userId: user.id,
    minutes,
    note: str(fd, "note")?.slice(0, 500) ?? null,
    spentOn,
  });
  await logActivity(user, {
    action: "time.logged",
    summary: `logged ${formatMinutes(minutes)} on "${task.title}"`,
    params: { title: task.title, duration: formatMinutes(minutes) },
    projectId: task.projectId,
    taskId: task.id,
  });
  revalidatePath(taskPath(task.id));
  return { ok: true };
}

/** Your own entries; admins may remove anyone's. */
export async function deleteTimeEntry(fd: FormData) {
  const user = await requireUser();
  const entry = await db.query.timeEntries.findFirst({
    where: and(eq(timeEntries.id, idOf(fd, "entryId")), eq(timeEntries.orgId, user.orgId)),
  });
  if (!entry) return;
  if (entry.userId !== user.id && user.role !== "admin") throw new ForbiddenError();
  await db.delete(timeEntries).where(eq(timeEntries.id, entry.id));
  revalidatePath(taskPath(entry.taskId));
}

/* ------------------------------------------------------------------ */
/* Calendar feed                                                       */
/* ------------------------------------------------------------------ */

/** Creates (or replaces) this person's private calendar link and shows it once. */
export async function createCalendarFeed(_prev: ActionState, _fd: FormData): Promise<ActionState> {
  void _fd;
  const user = await requireUser();
  const token = newToken();
  await db.update(users).set({ calendarTokenHash: hashToken(token) }).where(eq(users.id, user.id));
  const org = await getOrgById(user.orgId);
  const base = org ? tenantBaseUrl(org) : appUrl();
  revalidatePath("/calendar");
  return { ok: true, link: `${base}/api/calendar/${token}` };
}

export async function disableCalendarFeed() {
  const user = await requireUser();
  await db.update(users).set({ calendarTokenHash: null }).where(eq(users.id, user.id));
  revalidatePath("/calendar");
}
