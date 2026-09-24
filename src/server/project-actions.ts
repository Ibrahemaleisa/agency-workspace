"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/db";
import {
  chatMessages,
  clients,
  moduleTemplates,
  projectMembers,
  projectModules,
  projects,
  projectStatusEnum,
  tasks,
  users,
  type ProjectStatus,
} from "@/db/schema";
import { requireUser, type SessionUser } from "@/lib/auth";
import { getAccessibleProject } from "@/lib/access";
import { assertCan, ForbiddenError } from "@/lib/permissions";
import {
  getProjectAudience,
  getProjectStaffIds,
  listAdminIds,
  logActivity,
  notify,
  resolveMentions,
} from "@/lib/events";
import { nt } from "@/lib/notify-text";
import { addModuleToProject } from "@/lib/modules";
import { str, type ActionState } from "@/lib/action-state";
import { projectStatusLabel } from "@/lib/constants";
import { getT } from "@/lib/lang";

const msg = async () => (await getT()).t.actions;

const refresh = () => revalidatePath("/", "layout");

function parseProjectStatus(v: string | null): ProjectStatus {
  return v && (projectStatusEnum.enumValues as string[]).includes(v) ? (v as ProjectStatus) : "planning";
}

async function validInternalUserIds(user: SessionUser, ids: string[]) {
  if (ids.length === 0) return [];
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.orgId, user.orgId), inArray(users.id, ids), ne(users.role, "client")));
  return rows.map((r) => r.id);
}

/* ------------------------------------------------------------------ */
/* Projects                                                            */
/* ------------------------------------------------------------------ */

export async function createProject(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  assertCan(user, "projects.manage");
  const name = str(fd, "name");
  const clientId = str(fd, "clientId");
  if (!name) return { error: (await msg()).projectNameRequired };
  if (!clientId) return { error: (await msg()).chooseClient };
  const client = await db.query.clients.findFirst({
    where: and(eq(clients.id, clientId), eq(clients.orgId, user.orgId)),
  });
  if (!client) return { error: (await msg()).invalidClient };

  const startDate = str(fd, "startDate");
  const endDate = str(fd, "endDate");
  if (startDate && endDate && endDate < startDate) return { error: (await msg()).endAfterStart };

  const ownerId = (await validInternalUserIds(user, [str(fd, "ownerId") ?? user.id]))[0] ?? user.id;
  const [project] = await db
    .insert(projects)
    .values({
      orgId: user.orgId,
      clientId,
      name,
      description: str(fd, "description"),
      status: parseProjectStatus(str(fd, "status")),
      startDate,
      endDate,
      ownerId,
    })
    .returning();

  const memberIds = await validInternalUserIds(user, fd.getAll("memberIds").map(String));
  if (memberIds.length)
    await db.insert(projectMembers).values(memberIds.map((userId) => ({ projectId: project.id, userId })));

  const templateIds = fd.getAll("templateIds").map(String);
  if (templateIds.length) {
    const templates = await db
      .select()
      .from(moduleTemplates)
      .where(and(eq(moduleTemplates.orgId, user.orgId), inArray(moduleTemplates.id, templateIds)));
    for (const template of templates) {
      await addModuleToProject(db, { orgId: user.orgId, projectId: project.id, template, createdById: user.id });
    }
  }

  await logActivity(user, {
    action: "project.created",
    summary: `created project "${name}" for ${client.name}`,
    projectId: project.id,
    clientVisible: true,
  });
  await notify(user, memberIds.concat(ownerId), {
    type: "project",
    title: nt.addedToProject(name),
    body: project.description,
    link: `/projects/${project.id}`,
  });
  const team = new Set([...memberIds, ownerId]);
  await notify(user, (await listAdminIds(user.orgId)).filter((id) => !team.has(id)), {
    type: "project",
    title: nt.projectCreated(user.name, name, client.name),
    link: `/projects/${project.id}`,
  });
  refresh();
  redirect(`/projects/${project.id}`);
}

export async function updateProject(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  assertCan(user, "projects.manage");
  const project = await getAccessibleProject(user, str(fd, "projectId") ?? "");
  const name = str(fd, "name");
  if (!name) return { error: (await msg()).projectNameRequired };
  const startDate = str(fd, "startDate");
  const endDate = str(fd, "endDate");
  if (startDate && endDate && endDate < startDate) return { error: (await msg()).endAfterStart };
  const status = parseProjectStatus(str(fd, "status"));
  const ownerId = (await validInternalUserIds(user, [str(fd, "ownerId") ?? ""]))[0] ?? project.ownerId;

  await db
    .update(projects)
    .set({ name, description: str(fd, "description"), status, startDate, endDate, ownerId })
    .where(eq(projects.id, project.id));

  const memberIds = await validInternalUserIds(user, fd.getAll("memberIds").map(String));
  const existing = await db
    .select({ userId: projectMembers.userId })
    .from(projectMembers)
    .where(eq(projectMembers.projectId, project.id));
  const added = memberIds.filter((id) => !existing.some((e) => e.userId === id));
  await db.delete(projectMembers).where(eq(projectMembers.projectId, project.id));
  if (memberIds.length)
    await db.insert(projectMembers).values(memberIds.map((userId) => ({ projectId: project.id, userId })));

  const changes: string[] = [];
  if (status !== project.status) changes.push(`status to ${projectStatusLabel(status)}`);
  if (endDate !== project.endDate) changes.push(`end date to ${endDate ?? "none"}`);
  if (added.length) changes.push(`added ${added.length} member(s)`);
  await logActivity(user, {
    action: "project.updated",
    summary: changes.length ? `updated project "${name}": ${changes.join(", ")}` : `edited project "${name}"`,
    projectId: project.id,
    clientVisible: status !== project.status,
  });
  await notify(user, added, {
    type: "project",
    title: nt.addedToProject(name),
    link: `/projects/${project.id}`,
  });
  if (status !== project.status) {
    const [admins, staff] = await Promise.all([listAdminIds(user.orgId), getProjectStaffIds(project.id)]);
    await notify(user, [...admins, ...staff].filter((id) => !added.includes(id)), {
      type: "status",
      title: nt.projectStatus(user.name, name, status),
      link: `/projects/${project.id}`,
    });
  }
  refresh();
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Modules                                                             */
/* ------------------------------------------------------------------ */

export async function addModule(fd: FormData) {
  const user = await requireUser();
  assertCan(user, "projects.manage");
  const project = await getAccessibleProject(user, str(fd, "projectId") ?? "");
  const template = await db.query.moduleTemplates.findFirst({
    where: and(eq(moduleTemplates.id, str(fd, "templateId") ?? ""), eq(moduleTemplates.orgId, user.orgId)),
  });
  if (!template) throw new ForbiddenError("Unknown module template.");
  await addModuleToProject(db, { orgId: user.orgId, projectId: project.id, template, createdById: user.id });
  await logActivity(user, {
    action: "module.added",
    summary: `added ${template.name} module to "${project.name}"`,
    projectId: project.id,
    clientVisible: true,
  });
  refresh();
}

export async function removeModule(fd: FormData) {
  const user = await requireUser();
  assertCan(user, "projects.manage");
  const project = await getAccessibleProject(user, str(fd, "projectId") ?? "");
  const mod = await db.query.projectModules.findFirst({
    where: and(eq(projectModules.id, str(fd, "moduleId") ?? ""), eq(projectModules.projectId, project.id)),
  });
  if (!mod) return;
  // Removing a module removes its workflow; its tasks are deleted with it (explicit, confirmed in UI).
  await db.delete(tasks).where(eq(tasks.moduleId, mod.id));
  await db.delete(projectModules).where(eq(projectModules.id, mod.id));
  await logActivity(user, {
    action: "module.removed",
    summary: `removed ${mod.name} module from "${project.name}"`,
    projectId: project.id,
  });
  refresh();
}

export async function updateModuleFields(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  assertCan(user, "projects.manage");
  const project = await getAccessibleProject(user, str(fd, "projectId") ?? "");
  const mod = await db.query.projectModules.findFirst({
    where: and(eq(projectModules.id, str(fd, "moduleId") ?? ""), eq(projectModules.projectId, project.id)),
  });
  if (!mod) return { error: (await msg()).moduleNotFound };
  const values: Record<string, string> = {};
  for (const f of mod.fields) {
    const v = str(fd, `field_${f.key}`);
    if (v) values[f.key] = v;
  }
  await db.update(projectModules).set({ fieldValues: values }).where(eq(projectModules.id, mod.id));
  await logActivity(user, {
    action: "module.updated",
    summary: `updated ${mod.name} details on "${project.name}"`,
    projectId: project.id,
  });
  refresh();
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Chat                                                                */
/* ------------------------------------------------------------------ */

export async function sendChatMessage(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const project = await getAccessibleProject(user, str(fd, "projectId") ?? "");
  const body = str(fd, "body");
  if (!body) return { error: (await msg()).messageEmpty };
  const channel = str(fd, "channel") === "client" ? "client" : "internal";
  assertCan(user, channel === "client" ? "chat.client" : "chat.internal");

  await db.insert(chatMessages).values({ orgId: user.orgId, projectId: project.id, authorId: user.id, channel, body });

  const audience = await getProjectAudience(project.id);
  const people = channel === "client" ? [...audience.internal, ...audience.clients] : audience.internal;
  const mentioned = resolveMentions(body, people);
  const link = `/projects/${project.id}?tab=chat&channel=${channel}`;
  await notify(user, mentioned, { type: "mention", title: nt.mentionChat(user.name, project.name), body, link });

  // Everyone working on the project hears about new messages; clients too in the client channel.
  const recipients = await getProjectStaffIds(project.id);
  if (project.ownerId) recipients.push(project.ownerId);
  if (channel === "client") recipients.push(...audience.clients.map((c) => c.id));
  await notify(
    user,
    recipients.filter((id) => !mentioned.includes(id)),
    {
      type: "chat",
      title: channel === "client" ? nt.chatClient(user.name, project.name) : nt.chatInternal(user.name, project.name),
      body,
      link,
    },
  );
  refresh();
  return { ok: true };
}
