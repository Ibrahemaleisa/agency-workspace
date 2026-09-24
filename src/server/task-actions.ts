"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  attachments,
  projectModules,
  taskComments,
  tasks,
  users,
  priorityEnum,
  taskStatusEnum,
  type Priority,
  type TaskStatus,
} from "@/db/schema";
import { requireUser, type SessionUser } from "@/lib/auth";
import { getAccessibleProject, getAccessibleTask } from "@/lib/access";
import { assertCan, can, ForbiddenError } from "@/lib/permissions";
import {
  getProjectAudience,
  getProjectStaffIds,
  getTaskCommenterIds,
  listAdminIds,
  logActivity,
  notify,
  resolveMentions,
} from "@/lib/events";
import { nt } from "@/lib/notify-text";
import { bool, str, type ActionState } from "@/lib/action-state";
import { taskStatusLabel } from "@/lib/constants";
import { MAX_UPLOAD_BYTES, removeFile, saveFile } from "@/lib/uploads";
import { getT } from "@/lib/lang";

const msg = async () => (await getT()).t.actions;

const refresh = () => revalidatePath("/", "layout");
const taskLink = (id: string) => `/tasks/${id}`;


async function assertAssignable(user: SessionUser, assigneeId: string | null) {
  if (!assigneeId) return;
  const u = await db.query.users.findFirst({
    where: and(eq(users.id, assigneeId), eq(users.orgId, user.orgId)),
  });
  if (!u || u.role === "client") throw new ForbiddenError("Invalid assignee.");
}

function parseStatus(v: string | null): TaskStatus | null {
  return v && (taskStatusEnum.enumValues as string[]).includes(v) ? (v as TaskStatus) : null;
}
function parsePriority(v: string | null): Priority {
  return v && (priorityEnum.enumValues as string[]).includes(v) ? (v as Priority) : "medium";
}

/* ------------------------------------------------------------------ */
/* Create / edit                                                       */
/* ------------------------------------------------------------------ */

export async function createTask(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  assertCan(user, "tasks.create");
  const project = await getAccessibleProject(user, str(fd, "projectId") ?? "");
  const title = str(fd, "title");
  if (!title) return { error: (await msg()).titleRequired };

  // Employees without assign permission can only create tasks for themselves.
  let assigneeId = str(fd, "assigneeId");
  if (!can(user, "tasks.assign")) assigneeId = user.id;
  await assertAssignable(user, assigneeId);

  // "moduleStage" is encoded as "<moduleId>::<stage>" from a single picker.
  const [rawModuleId, rawStage] = (str(fd, "moduleStage") ?? "").split("::");
  const moduleId = rawModuleId || null;
  let stage: string | null = null;
  if (moduleId) {
    const mod = await db.query.projectModules.findFirst({
      where: and(eq(projectModules.id, moduleId), eq(projectModules.projectId, project.id)),
    });
    if (!mod) return { error: (await msg()).invalidModule };
    stage = mod.stages.some((s) => s.name === rawStage) ? rawStage : null;
  }

  if (fd.getAll("files").some((f) => f instanceof File && f.size > MAX_UPLOAD_BYTES))
    return { error: (await msg()).fileTooLarge(MAX_UPLOAD_BYTES / 1024 / 1024) };

  const requiresApproval = bool(fd, "requiresApproval");
  const [task] = await db
    .insert(tasks)
    .values({
      orgId: user.orgId,
      projectId: project.id,
      moduleId,
      stage,
      title,
      description: str(fd, "description"),
      assigneeId,
      priority: parsePriority(str(fd, "priority")),
      dueDate: str(fd, "dueDate"),
      clientVisible: requiresApproval || bool(fd, "clientVisible"),
      requiresApproval,
      createdById: user.id,
    })
    .returning();

  await logActivity(user, {
    action: "task.created",
    summary: `created task "${title}"`,
    projectId: project.id,
    taskId: task.id,
  });
  const uploaded = await storeAttachments(user, task, fd.getAll("files"), task.clientVisible && can(user, "tasks.setClientVisibility"));
  if (uploaded.error) return uploaded;
  if (assigneeId && assigneeId !== user.id) {
    await notify(user, [assigneeId], {
      type: "assigned",
      title: nt.assigned(user.name, title),
      body: task.description,
      link: taskLink(task.id),
    });
  }
  refresh();
  redirect(taskLink(task.id));
}

export async function updateTask(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  assertCan(user, "tasks.edit");
  const { task } = await getAccessibleTask(user, str(fd, "taskId") ?? "");
  const title = str(fd, "title");
  if (!title) return { error: (await msg()).titleRequired };

  const changes: Partial<typeof tasks.$inferInsert> = {
    title,
    description: str(fd, "description"),
    priority: parsePriority(str(fd, "priority")),
    dueDate: str(fd, "dueDate"),
    updatedAt: new Date(),
  };
  if (task.moduleId) {
    const mod = await db.query.projectModules.findFirst({ where: eq(projectModules.id, task.moduleId) });
    const stage = str(fd, "stage");
    changes.stage = stage && mod?.stages.some((s) => s.name === stage) ? stage : null;
  }
  if (can(user, "tasks.setClientVisibility")) {
    changes.requiresApproval = bool(fd, "requiresApproval");
    changes.clientVisible = changes.requiresApproval || bool(fd, "clientVisible");
    if (!changes.requiresApproval && task.approvalStatus === "pending") changes.approvalStatus = "none";
  }
  await db.update(tasks).set(changes).where(eq(tasks.id, task.id));

  const diffs: string[] = [];
  if (task.dueDate !== changes.dueDate) diffs.push(`due date to ${changes.dueDate ?? "none"}`);
  if (task.priority !== changes.priority) diffs.push(`priority to ${changes.priority}`);
  if (changes.clientVisible !== undefined && task.clientVisible !== changes.clientVisible)
    diffs.push(changes.clientVisible ? "shared with client" : "hidden from client");
  await logActivity(user, {
    action: "task.updated",
    summary: diffs.length ? `updated "${title}": ${diffs.join(", ")}` : `edited "${title}"`,
    projectId: task.projectId,
    taskId: task.id,
  });
  refresh();
  return { ok: true };
}

export async function assignTask(fd: FormData) {
  const user = await requireUser();
  assertCan(user, "tasks.assign");
  const { task } = await getAccessibleTask(user, str(fd, "taskId") ?? "");
  const assigneeId = str(fd, "assigneeId");
  if (assigneeId === task.assigneeId) return;
  await assertAssignable(user, assigneeId);
  await db.update(tasks).set({ assigneeId, updatedAt: new Date() }).where(eq(tasks.id, task.id));

  const assigneeName = assigneeId
    ? (await db.query.users.findFirst({ where: eq(users.id, assigneeId) }))?.name
    : null;
  await logActivity(user, {
    action: "task.assigned",
    summary: assigneeName ? `assigned "${task.title}" to ${assigneeName}` : `unassigned "${task.title}"`,
    projectId: task.projectId,
    taskId: task.id,
  });
  if (assigneeId) {
    await notify(user, [assigneeId], {
      type: "assigned",
      title: nt.assigned(user.name, task.title),
      body: task.description,
      link: taskLink(task.id),
    });
  }
  refresh();
}

export async function deleteTask(fd: FormData) {
  const user = await requireUser();
  assertCan(user, "tasks.delete");
  const { task } = await getAccessibleTask(user, str(fd, "taskId") ?? "");
  await db.delete(tasks).where(eq(tasks.id, task.id));
  await logActivity(user, {
    action: "task.deleted",
    summary: `deleted task "${task.title}"`,
    projectId: task.projectId,
  });
  refresh();
  redirect(`/projects/${task.projectId}?tab=tasks`);
}

/* ------------------------------------------------------------------ */
/* Status + approvals                                                  */
/* ------------------------------------------------------------------ */

export async function updateTaskStatus(fd: FormData) {
  const user = await requireUser();
  assertCan(user, "tasks.updateStatus");
  const { task, project } = await getAccessibleTask(user, str(fd, "taskId") ?? "");
  const status = parseStatus(str(fd, "status"));
  if (!status || status === task.status) return;

  let approvalStatus = task.approvalStatus;
  let clientVisible = task.clientVisible;
  if (status === "waiting_client" && task.requiresApproval) {
    approvalStatus = "pending";
    clientVisible = true;
  } else if (task.approvalStatus === "pending") {
    approvalStatus = "none";
  }

  await db
    .update(tasks)
    .set({
      status,
      approvalStatus,
      clientVisible,
      completedAt: status === "completed" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, task.id));

  await logActivity(user, {
    action: "task.status",
    summary: `moved "${task.title}" from ${taskStatusLabel(task.status)} to ${taskStatusLabel(status)}`,
    projectId: task.projectId,
    taskId: task.id,
    clientVisible,
  });
  // Progress updates go to every admin and everyone working on the project.
  const [admins, staff] = await Promise.all([listAdminIds(user.orgId), getProjectStaffIds(project.id)]);
  await notify(user, [task.assigneeId, task.createdById, ...admins, ...staff], {
    type: "status",
    title: nt.taskStatus(user.name, task.title, status, project.name),
    link: taskLink(task.id),
  });
  if (approvalStatus === "pending" && task.approvalStatus !== "pending") {
    const { clients } = await getProjectAudience(project.id);
    await notify(user, clients.map((c) => c.id), {
      type: "approval",
      title: nt.approvalRequested(task.title),
      link: taskLink(task.id),
    });
  }
  refresh();
}

/** One click: share the task with the client and ask them to approve it. */
export async function requestClientApproval(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  assertCan(user, "tasks.setClientVisibility");
  const { task, project } = await getAccessibleTask(user, str(fd, "taskId") ?? "");
  if (task.approvalStatus === "pending") return { error: (await msg()).alreadyPending };
  const note = str(fd, "note");

  await db
    .update(tasks)
    .set({
      requiresApproval: true,
      clientVisible: true,
      status: "waiting_client",
      approvalStatus: "pending",
      completedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, task.id));
  if (note) {
    await db.insert(taskComments).values({ orgId: user.orgId, taskId: task.id, authorId: user.id, body: note, internal: false });
  }
  await logActivity(user, {
    action: "approval.requested",
    summary: `requested client approval on "${task.title}"`,
    projectId: task.projectId,
    taskId: task.id,
    clientVisible: true,
  });

  const [{ clients }, admins, staff] = await Promise.all([
    getProjectAudience(project.id),
    listAdminIds(user.orgId),
    getProjectStaffIds(project.id),
  ]);
  await notify(user, clients.map((c) => c.id), {
    type: "approval",
    title: nt.approvalRequested(task.title),
    body: note,
    link: taskLink(task.id),
  });
  await notify(user, [task.assigneeId, task.createdById, ...admins, ...staff], {
    type: "status",
    title: nt.taskStatus(user.name, task.title, "waiting_client", project.name),
    link: taskLink(task.id),
  });
  refresh();
  return { ok: true };
}

export async function decideApproval(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  assertCan(user, "approvals.decide");
  const { task, project } = await getAccessibleTask(user, str(fd, "taskId") ?? "");
  if (task.approvalStatus !== "pending") return { error: (await msg()).notAwaiting };
  const decision = str(fd, "decision");
  const feedback = str(fd, "feedback");
  if (decision !== "approve" && decision !== "reject") return { error: (await msg()).invalidDecision };
  if (decision === "reject" && !feedback) return { error: (await msg()).describeChanges };

  const approved = decision === "approve";
  await db
    .update(tasks)
    .set({
      approvalStatus: approved ? "approved" : "rejected",
      status: approved ? "completed" : "in_progress",
      completedAt: approved ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, task.id));

  if (feedback) {
    await db.insert(taskComments).values({
      orgId: user.orgId,
      taskId: task.id,
      authorId: user.id,
      body: `${approved ? "✅ Approved" : "↩️ Changes requested"}: ${feedback}`,
      internal: false,
    });
  }
  await logActivity(user, {
    action: approved ? "approval.approved" : "approval.rejected",
    summary: `${approved ? "approved" : "requested changes on"} "${task.title}"`,
    projectId: task.projectId,
    taskId: task.id,
    clientVisible: true,
  });
  const { internal } = await getProjectAudience(project.id);
  await notify(user, [task.assigneeId, task.createdById, project.ownerId, ...internal.map((u) => u.id)], {
    type: "approval",
    title: nt.approvalDecided(user.name, approved, task.title),
    body: feedback,
    link: taskLink(task.id),
  });
  refresh();
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Comments                                                            */
/* ------------------------------------------------------------------ */

export async function addComment(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const { task, project } = await getAccessibleTask(user, str(fd, "taskId") ?? "");
  const body = str(fd, "body");
  if (!body) return { error: (await msg()).commentEmpty };

  // Clients can only post client-visible comments; staff choose, defaulting to internal.
  const internal = user.role === "client" ? false : !task.clientVisible || str(fd, "visibility") !== "client";
  assertCan(user, internal ? "comments.internal" : "comments.client");

  await db.insert(taskComments).values({ orgId: user.orgId, taskId: task.id, authorId: user.id, body, internal });
  await logActivity(user, {
    action: "comment.added",
    summary: `commented on "${task.title}"`,
    projectId: task.projectId,
    taskId: task.id,
    clientVisible: !internal,
  });

  const audience = await getProjectAudience(project.id);
  const mentionable = internal ? audience.internal : [...audience.internal, ...audience.clients];
  const mentioned = resolveMentions(body, mentionable);
  const link = taskLink(task.id);
  await notify(user, mentioned, { type: "mention", title: nt.mentionTask(user.name, task.title), body, link });

  // Assignee + creator always hear about comments on their task.
  const watchers = [task.assigneeId, task.createdById].filter((id) => id && !mentioned.includes(id));
  if (user.role === "client") watchers.push(project.ownerId);
  if (!internal && user.role !== "client") watchers.push(...audience.clients.map((c) => c.id));
  await notify(user, watchers, { type: "comment", title: nt.commentTask(user.name, task.title), body, link });

  // Anyone who already took part in the thread gets the reply (clients only for client-visible replies).
  const earlier = await getTaskCommenterIds(task.id);
  const repliedTo = earlier
    .filter((c) => c.id && (!internal || c.role !== "client"))
    .map((c) => c.id)
    .filter((id) => !mentioned.includes(id!) && !watchers.includes(id));
  await notify(user, repliedTo, { type: "comment", title: nt.replyTask(user.name, task.title), body, link });
  refresh();
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Attachments                                                         */
/* ------------------------------------------------------------------ */

export async function uploadAttachment(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  assertCan(user, "files.upload");
  const { task } = await getAccessibleTask(user, str(fd, "taskId") ?? "");
  const clientVisible = can(user, "tasks.setClientVisibility") && bool(fd, "clientVisible");
  const files = [...fd.getAll("files"), ...fd.getAll("file")];
  if (!files.some((f) => f instanceof File && f.size > 0)) return { error: (await msg()).chooseFile };
  const res = await storeAttachments(user, task, files, clientVisible);
  if (res.error) return res;
  refresh();
  return { ok: true };
}

export async function toggleAttachmentVisibility(fd: FormData) {
  const user = await requireUser();
  assertCan(user, "tasks.setClientVisibility");
  const att = await db.query.attachments.findFirst({
    where: and(eq(attachments.id, str(fd, "attachmentId") ?? ""), eq(attachments.orgId, user.orgId)),
  });
  if (!att) return;
  const { task } = await getAccessibleTask(user, att.taskId);
  const clientVisible = !att.clientVisible;
  await db.update(attachments).set({ clientVisible }).where(eq(attachments.id, att.id));
  if (clientVisible && !task.clientVisible)
    await db.update(tasks).set({ clientVisible: true }).where(eq(tasks.id, task.id));
  await logActivity(user, {
    action: "file.shared",
    summary: `${clientVisible ? "shared" : "unshared"} ${att.fileName} ${clientVisible ? "with" : "from"} client`,
    projectId: task.projectId,
    taskId: task.id,
    clientVisible,
  });
  refresh();
}

export async function deleteAttachment(fd: FormData) {
  const user = await requireUser();
  const att = await db.query.attachments.findFirst({
    where: and(eq(attachments.id, str(fd, "attachmentId") ?? ""), eq(attachments.orgId, user.orgId)),
  });
  if (!att) return;
  const { task } = await getAccessibleTask(user, att.taskId);
  if (att.uploaderId !== user.id && user.role !== "admin") throw new ForbiddenError();
  await db.delete(attachments).where(eq(attachments.id, att.id));
  await removeFile(att.storageKey);
  await logActivity(user, {
    action: "file.deleted",
    summary: `removed ${att.fileName} from "${task.title}"`,
    projectId: task.projectId,
    taskId: task.id,
  });
  refresh();
}

/** Save uploaded files (images or documents) on a task. */
async function storeAttachments(
  user: SessionUser,
  task: typeof tasks.$inferSelect,
  entries: FormDataEntryValue[],
  clientVisible: boolean,
): Promise<{ error?: string }> {
  const files = entries.filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return {};
  assertCan(user, "files.upload");
  if (files.some((f) => f.size > MAX_UPLOAD_BYTES))
    return { error: (await msg()).fileTooLarge(MAX_UPLOAD_BYTES / 1024 / 1024) };

  for (const file of files) {
    const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(-100);
    const storageKey = `${user.orgId}/${randomUUID()}-${safeName}`;
    const mimeType = file.type || "application/octet-stream";
    await saveFile(storageKey, Buffer.from(await file.arrayBuffer()), mimeType);
    await db.insert(attachments).values({
      orgId: user.orgId,
      taskId: task.id,
      uploaderId: user.id,
      fileName: file.name,
      storageKey,
      mimeType,
      size: file.size,
      clientVisible,
    });
  }
  if (clientVisible && !task.clientVisible) {
    await db.update(tasks).set({ clientVisible: true }).where(eq(tasks.id, task.id));
  }
  await logActivity(user, {
    action: "file.uploaded",
    summary: `uploaded ${files.map((f) => f.name).join(", ")} to "${task.title}"`,
    projectId: task.projectId,
    taskId: task.id,
    clientVisible,
  });
  return {};
}
