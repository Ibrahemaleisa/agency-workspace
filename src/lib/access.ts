import "server-only";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { projects, tasks } from "@/db/schema";
import type { SessionUser } from "./auth";
import { isUuid, projectScope, taskScope } from "./scope";

export { isUuid, projectScope, taskScope };

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
