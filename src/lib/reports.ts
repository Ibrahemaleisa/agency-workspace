import "server-only";
import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { clients, projects, tasks, timeEntries, users } from "@/db/schema";
import { format, startOfMonth } from "date-fns";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** A reporting period from query params (defaults to this month so far). */
export function period(from: unknown, to: unknown) {
  const today = format(new Date(), "yyyy-MM-dd");
  const f = typeof from === "string" && ISO.test(from) ? from : format(startOfMonth(new Date()), "yyyy-MM-dd");
  const t = typeof to === "string" && ISO.test(to) ? to : today;
  return f <= t ? { from: f, to: t } : { from: t, to: f };
}

export async function timeEntriesIn(orgId: string, p: { from: string; to: string }) {
  return db
    .select({
      spentOn: timeEntries.spentOn,
      minutes: timeEntries.minutes,
      note: timeEntries.note,
      person: users.name,
      personId: timeEntries.userId,
      task: tasks.title,
      taskId: tasks.id,
      project: projects.name,
      projectId: projects.id,
      client: clients.name,
    })
    .from(timeEntries)
    .innerJoin(tasks, eq(tasks.id, timeEntries.taskId))
    .innerJoin(projects, eq(projects.id, timeEntries.projectId))
    .innerJoin(clients, eq(clients.id, projects.clientId))
    .leftJoin(users, eq(users.id, timeEntries.userId))
    .where(and(eq(timeEntries.orgId, orgId), gte(timeEntries.spentOn, p.from), lte(timeEntries.spentOn, p.to)))
    .orderBy(asc(timeEntries.spentOn), asc(projects.name));
}

/** Every task of the workspace (for the CSV), newest first. */
export async function allTasks(orgId: string) {
  const assignee = users;
  return db
    .select({
      title: tasks.title,
      status: tasks.status,
      priority: tasks.priority,
      dueDate: tasks.dueDate,
      completedAt: tasks.completedAt,
      createdAt: tasks.createdAt,
      approval: tasks.approvalStatus,
      sharedWithClient: tasks.clientVisible,
      project: projects.name,
      client: clients.name,
      assignee: assignee.name,
      minutes: sql<number>`coalesce((select sum(${timeEntries.minutes}) from ${timeEntries} where ${timeEntries.taskId} = ${tasks.id}), 0)::int`,
    })
    .from(tasks)
    .innerJoin(projects, eq(projects.id, tasks.projectId))
    .innerJoin(clients, eq(clients.id, projects.clientId))
    .leftJoin(assignee, eq(assignee.id, tasks.assigneeId))
    .where(eq(tasks.orgId, orgId))
    .orderBy(desc(tasks.createdAt))
    .limit(50_000);
}

/** RFC 4180 CSV with a UTF-8 BOM, so Excel opens Arabic text correctly. */
export function toCsv(rows: (string | number | boolean | null | undefined)[][]) {
  const cell = (v: string | number | boolean | null | undefined) => {
    const s = v === null || v === undefined ? "" : String(v);
    // Cells starting with = + - @ would run as formulas in spreadsheets.
    const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
    return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  return "﻿" + rows.map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
}
