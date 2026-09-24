import "server-only";
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  gt,
  lt,
  ne,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { alias, type AnyPgColumn } from "drizzle-orm/pg-core";
import { format } from "date-fns";
import { db } from "@/db";
import {
  activityLog,
  clients,
  notifications,
  projectModules,
  projects,
  tasks,
  teamMessages,
  users,
  type TaskStatus,
} from "@/db/schema";
import type { SessionUser } from "@/lib/auth";
import { projectScope, taskScope } from "@/lib/access";

export const todayISO = () => format(new Date(), "yyyy-MM-dd");

/**
 * Keyword search: every word must appear in at least one of the given columns.
 * "bloom reel omar" finds Bloom Café tasks about reels assigned to Omar.
 */
export function keywordMatch(q: string | undefined, columns: AnyPgColumn[]): SQL | undefined {
  const words = (q ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 8)
    .map((w) => `%${w.replace(/[\\%_]/g, (c) => "\\" + c)}%`);
  if (words.length === 0) return undefined;
  return and(...words.map((w) => or(...columns.map((c) => ilike(c, w)))));
}

/* ------------------------------------------------------------------ */
/* Tasks                                                               */
/* ------------------------------------------------------------------ */

export type TaskFilter = {
  projectId?: string;
  moduleId?: string;
  assigneeId?: string | null; // null = unassigned
  status?: TaskStatus | "open";
  overdue?: boolean;
  dueToday?: boolean;
  approvalPending?: boolean;
  approvalDecided?: boolean;
  q?: string;
  limit?: number;
  orderBy?: "due" | "updated";
};

const assignee = alias(users, "assignee");

export async function listTasks(user: SessionUser, f: TaskFilter = {}) {
  const today = todayISO();
  const conds: (SQL | undefined)[] = [taskScope(user)];
  if (f.projectId) conds.push(eq(tasks.projectId, f.projectId));
  if (f.moduleId) conds.push(eq(tasks.moduleId, f.moduleId));
  if (f.assigneeId !== undefined)
    conds.push(f.assigneeId === null ? isNull(tasks.assigneeId) : eq(tasks.assigneeId, f.assigneeId));
  if (f.status === "open") conds.push(ne(tasks.status, "completed"));
  else if (f.status) conds.push(eq(tasks.status, f.status));
  if (f.overdue) conds.push(and(lt(tasks.dueDate, today), ne(tasks.status, "completed")));
  if (f.dueToday) conds.push(and(eq(tasks.dueDate, today), ne(tasks.status, "completed")));
  if (f.approvalPending) conds.push(eq(tasks.approvalStatus, "pending"));
  if (f.approvalDecided) conds.push(inArray(tasks.approvalStatus, ["approved", "rejected"]));
  conds.push(
    keywordMatch(f.q, [
      tasks.title,
      tasks.description,
      tasks.stage,
      projects.name,
      clients.name,
      projectModules.name,
      assignee.name,
    ]),
  );

  return db
    .select({
      id: tasks.id,
      title: tasks.title,
      status: tasks.status,
      priority: tasks.priority,
      dueDate: tasks.dueDate,
      stage: tasks.stage,
      approvalStatus: tasks.approvalStatus,
      requiresApproval: tasks.requiresApproval,
      clientVisible: tasks.clientVisible,
      updatedAt: tasks.updatedAt,
      projectId: projects.id,
      projectName: projects.name,
      clientName: clients.name,
      moduleId: projectModules.id,
      moduleName: projectModules.name,
      moduleColor: projectModules.color,
      assigneeId: tasks.assigneeId,
      assigneeName: assignee.name,
    })
    .from(tasks)
    .innerJoin(projects, eq(projects.id, tasks.projectId))
    .innerJoin(clients, eq(clients.id, projects.clientId))
    .leftJoin(projectModules, eq(projectModules.id, tasks.moduleId))
    .leftJoin(assignee, eq(assignee.id, tasks.assigneeId))
    .where(and(...conds))
    .orderBy(
      ...(f.orderBy === "updated"
        ? [desc(tasks.updatedAt)]
        : [
            sql`${tasks.status} = 'completed'`,
            sql`${tasks.dueDate} asc nulls last`,
            asc(projectModules.position),
            asc(tasks.createdAt),
          ]),
    )
    .limit(f.limit ?? 500);
}

export type TaskRow = Awaited<ReturnType<typeof listTasks>>[number];

export async function taskCountsByStatus(user: SessionUser) {
  const rows = await db
    .select({ status: tasks.status, n: count() })
    .from(tasks)
    .innerJoin(projects, eq(projects.id, tasks.projectId))
    .where(and(taskScope(user), inArray(projects.status, ["planning", "active", "on_hold"])))
    .groupBy(tasks.status);
  return Object.fromEntries(rows.map((r) => [r.status, r.n])) as Partial<Record<TaskStatus, number>>;
}

/** Open tasks per internal user, with overdue counts. */
export async function teamWorkload(user: SessionUser) {
  const today = todayISO();
  return db
    .select({
      id: users.id,
      name: users.name,
      title: users.title,
      open: sql<number>`count(${tasks.id}) filter (where ${tasks.status} <> 'completed')`.mapWith(Number),
      overdue: sql<number>`count(${tasks.id}) filter (where ${tasks.status} <> 'completed' and ${tasks.dueDate} < ${today})`.mapWith(Number),
      inReview: sql<number>`count(${tasks.id}) filter (where ${tasks.status} = 'review')`.mapWith(Number),
    })
    .from(users)
    .leftJoin(tasks, eq(tasks.assigneeId, users.id))
    .where(and(eq(users.orgId, user.orgId), ne(users.role, "client"), eq(users.active, true)))
    .groupBy(users.id)
    .orderBy(desc(sql`count(${tasks.id}) filter (where ${tasks.status} <> 'completed')`), asc(users.name));
}

/* ------------------------------------------------------------------ */
/* Projects                                                            */
/* ------------------------------------------------------------------ */

const owner = alias(users, "owner");

export async function listProjects(
  user: SessionUser,
  f: { status?: string; clientId?: string; q?: string } = {},
) {
  const today = todayISO();
  const conds: (SQL | undefined)[] = [projectScope(user)];
  if (f.status === "open") conds.push(inArray(projects.status, ["planning", "active", "on_hold"]));
  else if (f.status) conds.push(eq(projects.status, f.status as never));
  if (f.clientId) conds.push(eq(projects.clientId, f.clientId));
  conds.push(keywordMatch(f.q, [projects.name, projects.description, clients.name, clients.industry, owner.name]));

  const taskStats = db
    .select({
      projectId: tasks.projectId,
      total: count().as("total"),
      done: sql<number>`count(*) filter (where ${tasks.status} = 'completed')`.as("done"),
      overdue: sql<number>`count(*) filter (where ${tasks.status} <> 'completed' and ${tasks.dueDate} < ${today})`.as("overdue"),
      waiting: sql<number>`count(*) filter (where ${tasks.approvalStatus} = 'pending')`.as("waiting"),
    })
    .from(tasks)
    .groupBy(tasks.projectId)
    .as("task_stats");

  const rows = await db
    .select({
      id: projects.id,
      name: projects.name,
      status: projects.status,
      startDate: projects.startDate,
      endDate: projects.endDate,
      clientId: clients.id,
      clientName: clients.name,
      ownerName: owner.name,
      total: sql<number>`coalesce(${taskStats.total}, 0)`.mapWith(Number),
      done: sql<number>`coalesce(${taskStats.done}, 0)`.mapWith(Number),
      overdue: sql<number>`coalesce(${taskStats.overdue}, 0)`.mapWith(Number),
      waiting: sql<number>`coalesce(${taskStats.waiting}, 0)`.mapWith(Number),
    })
    .from(projects)
    .innerJoin(clients, eq(clients.id, projects.clientId))
    .leftJoin(owner, eq(owner.id, projects.ownerId))
    .leftJoin(taskStats, eq(taskStats.projectId, projects.id))
    .where(and(...conds))
    .orderBy(
      sql`case ${projects.status} when 'active' then 0 when 'planning' then 1 when 'on_hold' then 2 else 3 end`,
      asc(projects.endDate),
    );

  const mods = rows.length
    ? await db
        .select({ projectId: projectModules.projectId, name: projectModules.name, color: projectModules.color })
        .from(projectModules)
        .where(inArray(projectModules.projectId, rows.map((r) => r.id)))
        .orderBy(asc(projectModules.position))
    : [];

  return rows.map((r) => ({
    ...r,
    progress: r.total ? Math.round((r.done / r.total) * 100) : 0,
    modules: mods.filter((m) => m.projectId === r.id),
  }));
}

export type ProjectRow = Awaited<ReturnType<typeof listProjects>>[number];

/* ------------------------------------------------------------------ */
/* Activity + notifications                                            */
/* ------------------------------------------------------------------ */

const actor = alias(users, "actor");

export async function listActivity(
  user: SessionUser,
  f: { projectId?: string; taskId?: string; limit?: number } = {},
) {
  const conds: (SQL | undefined)[] = [eq(activityLog.orgId, user.orgId)];
  if (f.projectId) conds.push(eq(activityLog.projectId, f.projectId));
  if (f.taskId) conds.push(eq(activityLog.taskId, f.taskId));
  if (user.role === "client") conds.push(eq(activityLog.clientVisible, true));

  // Non-admins only see activity for projects they can access.
  const needsProjectScope = user.role !== "admin";
  const q = db
    .select({
      id: activityLog.id,
      action: activityLog.action,
      summary: activityLog.summary,
      createdAt: activityLog.createdAt,
      actorName: actor.name,
      projectId: activityLog.projectId,
      projectName: projects.name,
      taskId: activityLog.taskId,
    })
    .from(activityLog)
    .leftJoin(actor, eq(actor.id, activityLog.actorId))
    .leftJoin(projects, eq(projects.id, activityLog.projectId))
    .where(and(...conds, needsProjectScope ? projectScope(user) : undefined))
    .orderBy(desc(activityLog.createdAt))
    .limit(f.limit ?? 50);
  return q;
}

export type ActivityRow = Awaited<ReturnType<typeof listActivity>>[number];

export async function unreadNotificationCount(userId: string) {
  const [row] = await db
    .select({ n: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  return row?.n ?? 0;
}

export async function unreadTeamMessages(user: SessionUser) {
  const [row] = await db
    .select({ n: count() })
    .from(teamMessages)
    .where(
      and(
        eq(teamMessages.orgId, user.orgId),
        ne(teamMessages.authorId, user.id),
        user.teamChatSeenAt ? gt(teamMessages.createdAt, user.teamChatSeenAt) : undefined,
      ),
    );
  return row?.n ?? 0;
}

/* ------------------------------------------------------------------ */
/* People                                                              */
/* ------------------------------------------------------------------ */

export async function listInternalUsers(orgId: string) {
  return db
    .select({ id: users.id, name: users.name, title: users.title, role: users.role })
    .from(users)
    .where(and(eq(users.orgId, orgId), ne(users.role, "client"), eq(users.active, true)))
    .orderBy(asc(users.name));
}

export async function listClientsForOrg(orgId: string) {
  return db
    .select({ id: clients.id, name: clients.name })
    .from(clients)
    .where(eq(clients.orgId, orgId))
    .orderBy(asc(clients.name));
}

export async function searchClients(user: SessionUser, q: string) {
  return db
    .select({ id: clients.id, name: clients.name, industry: clients.industry, contactName: clients.contactName })
    .from(clients)
    .where(
      and(
        eq(clients.orgId, user.orgId),
        keywordMatch(q, [clients.name, clients.industry, clients.contactName, clients.contactEmail, clients.website]),
      ),
    )
    .orderBy(asc(clients.name))
    .limit(20);
}

/** Open projects × task status counts, for the dashboard health matrix. */
export async function projectMatrix(user: SessionUser) {
  const today = todayISO();
  const rows = await db
    .select({
      id: projects.id,
      name: projects.name,
      status: projects.status,
      startDate: projects.startDate,
      endDate: projects.endDate,
      clientName: clients.name,
      todo: sql<number>`count(${tasks.id}) filter (where ${tasks.status} = 'todo')`.mapWith(Number),
      in_progress: sql<number>`count(${tasks.id}) filter (where ${tasks.status} = 'in_progress')`.mapWith(Number),
      review: sql<number>`count(${tasks.id}) filter (where ${tasks.status} = 'review')`.mapWith(Number),
      waiting_client: sql<number>`count(${tasks.id}) filter (where ${tasks.status} = 'waiting_client')`.mapWith(Number),
      completed: sql<number>`count(${tasks.id}) filter (where ${tasks.status} = 'completed')`.mapWith(Number),
      overdue: sql<number>`count(${tasks.id}) filter (where ${tasks.status} <> 'completed' and ${tasks.dueDate} < ${today})`.mapWith(Number),
    })
    .from(projects)
    .innerJoin(clients, eq(clients.id, projects.clientId))
    .leftJoin(tasks, eq(tasks.projectId, projects.id))
    .where(and(projectScope(user), inArray(projects.status, ["planning", "active", "on_hold"])))
    .groupBy(projects.id, clients.name)
    .orderBy(asc(projects.endDate));
  return rows;
}

export type MatrixRow = Awaited<ReturnType<typeof projectMatrix>>[number];
