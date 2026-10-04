import "server-only";
import { and, eq, exists, or, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { projectMembers, projects, tasks } from "@/db/schema";
import type { SessionUser } from "./auth";
import { can } from "./permissions";

/**
 * Resource-level access rules. Every query that lists projects or tasks for a user
 * should be filtered through these helpers so role scoping stays in one place.
 */

// Aliased so the correlated subquery never clashes with an outer `tasks` in the same query.
const assignedTask = alias(tasks, "assigned_task");

/** SQL condition selecting the projects a user may see. */
export function projectScope(user: SessionUser): SQL {
  const org = eq(projects.orgId, user.orgId);
  if (can(user, "projects.viewAll")) return org;
  if (user.role === "client") {
    return and(org, user.clientId ? eq(projects.clientId, user.clientId) : sql`false`)!;
  }
  // Employees: projects they own, are members of, or have a task assigned to them in
  // (the same people `getProjectStaffIds` notifies about the project).
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
      exists(
        db
          .select({ one: sql`1` })
          .from(assignedTask)
          .where(and(eq(assignedTask.projectId, projects.id), eq(assignedTask.assigneeId, user.id))),
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

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
