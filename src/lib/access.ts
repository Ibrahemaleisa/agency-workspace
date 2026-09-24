import "server-only";
import { and, eq, exists, or, sql, type SQL } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { projectMembers, projects, tasks } from "@/db/schema";
import type { SessionUser } from "./auth";
import { can } from "./permissions";

/**
 * Resource-level access rules. Every query that lists projects or tasks for a user
 * should be filtered through these helpers so role scoping stays in one place.
 */

/** SQL condition selecting the projects a user may see. */
export function projectScope(user: SessionUser): SQL {
  const org = eq(projects.orgId, user.orgId);
  if (can(user, "projects.viewAll")) return org;
  if (user.role === "client") {
    return and(org, user.clientId ? eq(projects.clientId, user.clientId) : sql`false`)!;
  }
  return and(
    org,
    or(
      eq(projects.ownerId, user.id),
      exists(
        db
          .select({ one: sql`1` })
          .from(projectMembers)
          .where(
            and(eq(projectMembers.projectId, projects.id), eq(projectMembers.userId, user.id)),
          ),
      ),
    ),
  )!;
}

/**
 * SQL condition selecting tasks a user may see.
 * Must be used in queries that join `projects` on `tasks.projectId`.
 */
export function taskScope(user: SessionUser): SQL {
  const base = projectScope(user);
  if (user.role === "client") return and(base, eq(tasks.clientVisible, true))!;
  return base;
}

export async function getAccessibleProject(user: SessionUser, projectId: string) {
  if (!isUuid(projectId)) notFound();
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), projectScope(user)))
    .limit(1);
  if (!project) notFound();
  return project;
}

export async function getAccessibleTask(user: SessionUser, taskId: string) {
  if (!isUuid(taskId)) notFound();
  const [row] = await db
    .select({ task: tasks, project: projects })
    .from(tasks)
    .innerJoin(projects, eq(projects.id, tasks.projectId))
    .where(and(eq(tasks.id, taskId), taskScope(user)))
    .limit(1);
  if (!row) notFound();
  return row;
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
