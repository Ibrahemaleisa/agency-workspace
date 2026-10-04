import "server-only";
import { after } from "next/server";
import { and, eq, exists, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { activityLog, clients, notifications, projectMembers, projects, taskComments, tasks, users } from "@/db/schema";
import { notificationEmail, sendEmail } from "./email";
import { getBrand } from "./brand";
import type { SessionUser } from "./auth";

/* ------------------------------------------------------------------ */
/* Activity log                                                        */
/* ------------------------------------------------------------------ */

export async function logActivity(
  actor: SessionUser,
  entry: {
    action: string;
    summary: string;
    projectId?: string | null;
    taskId?: string | null;
    clientVisible?: boolean;
  },
) {
  await db.insert(activityLog).values({
    orgId: actor.orgId,
    actorId: actor.id,
    action: entry.action,
    summary: entry.summary,
    projectId: entry.projectId ?? null,
    taskId: entry.taskId ?? null,
    clientVisible: entry.clientVisible ?? false,
  });
}

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

export type NotificationType =
  | "assigned"
  | "mention"
  | "comment"
  | "status"
  | "approval"
  | "chat"
  | "team_chat"
  | "project"
  | "lead";

/** Notification text in both app languages. */
export type Localized = { en: string; ar: string };

/**
 * Notify users in the app and by email (in each recipient's language).
 * The actor never notifies themselves; emails are sent after the response so actions stay fast.
 */
export async function notify(
  actor: { id: string | null; orgId: string },
  recipientIds: Iterable<string | null | undefined>,
  n: { type: NotificationType; title: Localized; body?: string | null; link?: string },
) {
  const ids = [...new Set([...recipientIds].filter((id): id is string => !!id && id !== actor.id))];
  if (ids.length === 0) return;
  const body = n.body ? excerpt(n.body) : null;
  await db.insert(notifications).values(
    ids.map((userId) => ({
      orgId: actor.orgId,
      userId,
      actorId: actor.id,
      type: n.type,
      title: n.title.en,
      titleAr: n.title.ar,
      body,
      link: n.link ?? null,
    })),
  );
  after(() => emailRecipients(ids, { ...n, body }));
}

async function emailRecipients(ids: string[], n: { title: Localized; body?: string | null; link?: string }) {
  const people = await db
    .select({ email: users.email, lang: users.lang })
    .from(users)
    .where(and(inArray(users.id, ids), eq(users.active, true), eq(users.emailNotifications, true)));
  const brand = await getBrand();
  await Promise.allSettled(
    people.map(async (p) => {
      const lang = p.lang === "en" ? "en" : "ar";
      const mail = notificationEmail({ lang, title: n.title[lang], body: n.body, link: n.link, brand });
      try {
        await sendEmail({ to: p.email, ...mail });
      } catch (err) {
        console.error(`[email failed] to=${p.email}`, err);
      }
    }),
  );
}

function excerpt(text: string, max = 400) {
  const t = text.trim();
  return t.length > max ? t.slice(0, max - 1) + "…" : t;
}

/** Active admins of an organization. */
export async function listAdminIds(orgId: string) {
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.orgId, orgId), eq(users.role, "admin"), eq(users.active, true)));
  return rows.map((r) => r.id);
}

/** Active agency staff (admins + employees) of an organization. */
export async function listStaffIds(orgId: string) {
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.orgId, orgId), inArray(users.role, ["admin", "employee"]), eq(users.active, true)));
  return rows.map((r) => r.id);
}

/**
 * Everyone on the agency side who works on a project:
 * owner, members, and anyone assigned a task in it.
 */
export async function getProjectStaffIds(projectId: string) {
  const [{ internal }, assignees] = await Promise.all([
    getProjectAudience(projectId),
    db
      .selectDistinct({ id: tasks.assigneeId })
      .from(tasks)
      .innerJoin(users, eq(users.id, tasks.assigneeId))
      .where(and(eq(tasks.projectId, projectId), eq(users.active, true))),
  ]);
  return [...new Set([...internal.map((u) => u.id), ...assignees.map((a) => a.id).filter((id): id is string => !!id)])];
}

/** People who already commented on a task (optionally only on client-visible comments). */
export async function getTaskCommenterIds(taskId: string, clientVisibleOnly = false) {
  const rows = await db
    .selectDistinct({ id: taskComments.authorId, role: users.role })
    .from(taskComments)
    .innerJoin(users, eq(users.id, taskComments.authorId))
    .where(and(eq(taskComments.taskId, taskId), clientVisibleOnly ? eq(taskComments.internal, false) : undefined));
  return rows;
}

/** People involved in a project: internal owner + members, and the client's portal users. */
export async function getProjectAudience(projectId: string) {
  const project = await db.query.projects.findFirst({ where: eq(projects.id, projectId) });
  if (!project) return { internal: [], clients: [] };
  const members = await db
    .select({ userId: projectMembers.userId })
    .from(projectMembers)
    .where(eq(projectMembers.projectId, projectId));
  const internalIds = new Set(members.map((m) => m.userId));
  if (project.ownerId) internalIds.add(project.ownerId);

  const people = await db
    .select({ id: users.id, name: users.name, role: users.role, email: users.email })
    .from(users)
    .where(
      and(
        eq(users.orgId, project.orgId),
        eq(users.active, true),
        or(
          internalIds.size ? inArray(users.id, [...internalIds]) : undefined,
          // Only while the client is active: inactive clients' portal users are cut off.
          and(
            eq(users.role, "client"),
            eq(users.clientId, project.clientId),
            exists(db.select({ one: sql`1` }).from(clients).where(and(eq(clients.id, project.clientId), eq(clients.active, true)))),
          ),
        ),
      ),
    );
  return {
    internal: people.filter((p) => p.role !== "client"),
    clients: people.filter((p) => p.role === "client"),
  };
}

/**
 * Resolve @mentions in text against a list of candidate users.
 * Matches "@firstname" or "@firstname.lastname" (case-insensitive).
 */
export function resolveMentions(text: string, candidates: { id: string; name: string }[]) {
  const tokens = [...text.matchAll(/@([\p{L}][\p{L}.\-]*)/gu)].map((m) =>
    m[1].toLowerCase().replace(/[.\-]+$/, ""),
  );
  if (tokens.length === 0) return [];
  const ids = new Set<string>();
  for (const c of candidates) {
    const parts = c.name.toLowerCase().split(/\s+/);
    const handles = [parts[0], parts.join("."), parts.join("")];
    if (tokens.some((t) => handles.includes(t))) ids.add(c.id);
  }
  return [...ids];
}
