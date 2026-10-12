"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, inArray, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  accounts,
  chatMessages,
  clients,
  leads,
  moduleTemplates,
  organizations,
  projects,
  taskComments,
  teamMessages,
  users,
} from "@/db/schema";
import { destroySession, requireUser, verifyAccount, type SessionUser } from "@/lib/auth";
import { getAccessibleProject, getAccessibleTask } from "@/lib/access";
import { assertCan, ForbiddenError } from "@/lib/permissions";
import { logActivity } from "@/lib/events";
import { idOf, str, type ActionState } from "@/lib/action-state";
import { getT } from "@/lib/lang";
import { isPlatform, isSharedDemo } from "@/lib/platform";
import { ProviderCancelError, deleteOrganization, deleteOrphanAccounts, fileKeysForProjects } from "@/lib/lifecycle";
import { removeFiles } from "@/lib/uploads";
import { audit } from "@/lib/audit";

const errs = async () => (await getT()).t.lifecycle.errors;
const refresh = () => revalidatePath("/", "layout");

/** The typed confirmation must match exactly (trimmed). */
const confirmed = (fd: FormData, expected: string) => (str(fd, "confirm") ?? "") === expected.trim();

async function passwordOk(user: SessionUser, fd: FormData) {
  const account = await db.query.accounts.findFirst({ where: eq(accounts.id, user.accountId) });
  return !!account && !!(await verifyAccount(account.email, str(fd, "password") ?? ""));
}

/* ------------------------------------------------------------------ */
/* Projects, clients, templates, leads                                 */
/* ------------------------------------------------------------------ */

export async function deleteProject(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  assertCan(user, "projects.manage");
  const project = await getAccessibleProject(user, idOf(fd, "projectId"));
  if (!confirmed(fd, project.name)) return { error: (await errs()).confirm };
  const fileKeys = await fileKeysForProjects([project.id]);
  await db.delete(projects).where(eq(projects.id, project.id));
  await removeFiles(fileKeys);
  await logActivity(user, { action: "project.deleted", summary: `deleted project "${project.name}"`, params: { name: project.name } });
  refresh();
  redirect("/projects");
}

/** Deletes a client with all of their projects and their portal memberships. */
export async function deleteClient(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  assertCan(user, "clients.manage");
  const client = await db.query.clients.findFirst({ where: and(eq(clients.id, idOf(fd, "clientId")), eq(clients.orgId, user.orgId)) });
  if (!client) return { error: (await errs()).notFound };
  if (!confirmed(fd, client.name)) return { error: (await errs()).confirm };
  const projectIds = (
    await db.select({ id: projects.id }).from(projects).where(and(eq(projects.clientId, client.id), eq(projects.orgId, user.orgId)))
  ).map((p) => p.id);
  const fileKeys = await fileKeysForProjects(projectIds);
  const portal = await db
    .select({ id: users.id, accountId: users.accountId })
    .from(users)
    .where(and(eq(users.orgId, user.orgId), eq(users.clientId, client.id), eq(users.role, "client")));
  await db.transaction(async (tx) => {
    if (projectIds.length) await tx.delete(projects).where(inArray(projects.id, projectIds));
    if (portal.length) await tx.delete(users).where(inArray(users.id, portal.map((p) => p.id)));
    await tx.delete(clients).where(eq(clients.id, client.id));
  });
  await deleteOrphanAccounts(portal.map((p) => p.accountId));
  await removeFiles(fileKeys);
  await logActivity(user, { action: "client.deleted", summary: `deleted client ${client.name}`, params: { name: client.name } });
  refresh();
  redirect("/clients");
}

export async function deleteTemplate(fd: FormData) {
  const user = await requireUser();
  assertCan(user, "templates.manage");
  const [row] = await db
    .delete(moduleTemplates)
    .where(and(eq(moduleTemplates.id, idOf(fd, "templateId")), eq(moduleTemplates.orgId, user.orgId)))
    .returning({ name: moduleTemplates.name });
  if (row) await logActivity(user, { action: "template.deleted", summary: `deleted module template ${row.name}`, params: { name: row.name } });
  revalidatePath("/templates");
}

export async function deleteLead(fd: FormData) {
  const user = await requireUser();
  assertCan(user, "leads.manage");
  await db.delete(leads).where(and(eq(leads.id, idOf(fd, "leadId")), eq(leads.orgId, user.orgId)));
  revalidatePath("/leads");
}

/* ------------------------------------------------------------------ */
/* People                                                              */
/* ------------------------------------------------------------------ */

/** Admin: remove someone from this workspace for good (deactivating keeps them; this doesn't). */
export async function removeMember(fd: FormData) {
  const admin = await requireUser();
  assertCan(admin, "users.manage");
  const target = await db.query.users.findFirst({ where: and(eq(users.id, idOf(fd, "userId")), eq(users.orgId, admin.orgId)) });
  if (!target) return;
  if (target.id === admin.id) throw new ForbiddenError((await errs()).self);
  if (isSharedDemo()) throw new ForbiddenError((await errs()).demo);
  await db.delete(users).where(eq(users.id, target.id));
  await deleteOrphanAccounts([target.accountId]);
  await logActivity(admin, { action: "user.removed", summary: `removed ${target.name} from the workspace`, params: { name: target.name } });
  refresh();
}

/**
 * Anyone: delete my account — every membership and the sign-in itself. Refused while the person is
 * the only active admin of a workspace that would be left without one.
 */
export async function deleteMyAccount(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser({ allowLocked: true });
  const e = await errs();
  if (isSharedDemo()) return { error: e.demo };
  if (!confirmed(fd, user.email)) return { error: e.confirm };
  if (!(await passwordOk(user, fd))) return { error: e.password };

  const mine = await db
    .select({ orgId: users.orgId, role: users.role, orgName: organizations.name })
    .from(users)
    .innerJoin(organizations, eq(organizations.id, users.orgId))
    .where(and(eq(users.accountId, user.accountId), eq(organizations.isDemo, false)));
  const blocking: string[] = [];
  for (const m of mine.filter((m) => m.role === "admin")) {
    const [{ n }] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(users)
      .where(and(eq(users.orgId, m.orgId), eq(users.role, "admin"), eq(users.active, true), ne(users.accountId, user.accountId)));
    if (n === 0) blocking.push(m.orgName);
  }
  if (blocking.length) return { error: e.soleAdmin(blocking.join("، ")) };

  await destroySession();
  await db.delete(accounts).where(eq(accounts.id, user.accountId));
  redirect("/login");
}

/* ------------------------------------------------------------------ */
/* Comments and messages                                               */
/* ------------------------------------------------------------------ */

export async function editComment(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const comment = await db.query.taskComments.findFirst({
    where: and(eq(taskComments.id, idOf(fd, "commentId")), eq(taskComments.orgId, user.orgId)),
  });
  if (!comment || comment.authorId !== user.id) return { error: (await errs()).notFound };
  await getAccessibleTask(user, comment.taskId);
  const body = str(fd, "body");
  if (!body) return { error: (await errs()).empty };
  await db.update(taskComments).set({ body, editedAt: new Date() }).where(eq(taskComments.id, comment.id));
  refresh();
  return { ok: true };
}

/** The author, or an admin, may delete a comment. */
export async function deleteComment(fd: FormData) {
  const user = await requireUser();
  const comment = await db.query.taskComments.findFirst({
    where: and(eq(taskComments.id, idOf(fd, "commentId")), eq(taskComments.orgId, user.orgId)),
  });
  if (!comment) return;
  await getAccessibleTask(user, comment.taskId);
  if (comment.authorId !== user.id && user.role !== "admin") throw new ForbiddenError();
  await db.delete(taskComments).where(eq(taskComments.id, comment.id));
  refresh();
}

export async function deleteChatMessage(fd: FormData) {
  const user = await requireUser();
  const msg = await db.query.chatMessages.findFirst({
    where: and(eq(chatMessages.id, idOf(fd, "messageId")), eq(chatMessages.orgId, user.orgId)),
  });
  if (!msg) return;
  await getAccessibleProject(user, msg.projectId);
  if (msg.authorId !== user.id && user.role !== "admin") throw new ForbiddenError();
  await db.delete(chatMessages).where(eq(chatMessages.id, msg.id));
  refresh();
}

export async function deleteTeamMessage(fd: FormData) {
  const user = await requireUser();
  assertCan(user, "chat.internal");
  const msg = await db.query.teamMessages.findFirst({
    where: and(eq(teamMessages.id, idOf(fd, "messageId")), eq(teamMessages.orgId, user.orgId)),
  });
  if (!msg) return;
  if (msg.authorId !== user.id && user.role !== "admin") throw new ForbiddenError();
  await db.delete(teamMessages).where(eq(teamMessages.id, msg.id));
  revalidatePath("/chat");
}

/* ------------------------------------------------------------------ */
/* The whole workspace                                                 */
/* ------------------------------------------------------------------ */

/** Admin (platform mode): delete this workspace for everyone. Needs the address typed and the password. */
export async function deleteWorkspace(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser({ allowLocked: true });
  assertCan(user, "billing.manage");
  assertCan(user, "users.manage");
  const e = await errs();
  if (!isPlatform()) return { error: e.notFound };
  const org = await db.query.organizations.findFirst({ where: eq(organizations.id, user.orgId) });
  if (!org || org.isDemo) return { error: e.demo };
  if (!confirmed(fd, org.slug)) return { error: e.confirm };
  if (!(await passwordOk(user, fd))) return { error: e.password };
  try {
    await deleteOrganization(org.id);
  } catch (err) {
    if (err instanceof ProviderCancelError) return { error: e.provider };
    throw err;
  }
  await audit({ adminEmail: user.email, action: "workspace.deleted_by_customer", target: `${org.serial} ${org.slug}`, meta: { name: org.name } });
  await destroySession();
  redirect("/login");
}
