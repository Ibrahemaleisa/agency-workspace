import "server-only";
import { and, count, eq, inArray, isNotNull, isNull, ne } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { activityLog, chatMessages, clients, invitations, notifications, organizations, projects, teamMessages, users } from "@/db/schema";
import type { SessionUser } from "./auth";
import { flowFor, type Flow } from "./onboarding";

/**
 * The tutorial track: a short "getting started" checklist per role (owner, account manager,
 * production, client). Unlike the guided tour, which shows where things are, each step here is
 * ticked off by actually doing it, read from the workspace's own data, so it can't drift.
 * Copy lives in i18n-saas (track.flows.<flow>.<step id>).
 */
export const TRACK_STEPS = {
  admin: [
    { id: "brand", href: "/settings/brand" },
    { id: "client", href: "/clients/new" },
    { id: "project", href: "/projects/new" },
    { id: "team", href: "/team" },
    { id: "portal", href: "/team" },
    { id: "approval", href: "/tasks" },
  ],
  account: [
    { id: "status", href: "/tasks?view=mine" },
    { id: "comment", href: "/tasks?view=mine" },
    { id: "file", href: "/tasks?view=mine" },
    { id: "approval", href: "/tasks?view=mine" },
    { id: "chat", href: "/chat" },
  ],
  production: [
    { id: "status", href: "/tasks?view=mine" },
    { id: "comment", href: "/tasks?view=mine" },
    { id: "file", href: "/tasks?view=mine" },
    { id: "chat", href: "/chat" },
  ],
  client: [
    { id: "decide", href: "/approvals" },
    { id: "comment", href: "/projects" },
    { id: "chat", href: "/projects" },
    { id: "updates", href: "/notifications" },
  ],
} as const satisfies Record<Flow, readonly { id: string; href: string }[]>;

export type TrackStepId = (typeof TRACK_STEPS)[Flow][number]["id"];
export type TrackStep = { id: TrackStepId; href: string; done: boolean };

export const TRACK_HIDDEN_COOKIE = "track_hidden";

/** Who has hidden the track in this browser (a display preference, not a permission). */
export async function hiddenTrackUsers(): Promise<string[]> {
  return ((await cookies()).get(TRACK_HIDDEN_COOKIE)?.value ?? "").split(",").filter(Boolean);
}

const n = (rows: { n: number }[]) => Number(rows[0]?.n ?? 0);

/** What this person has already done, per activity type. */
async function myActions(user: SessionUser) {
  const rows = await db
    .select({ action: activityLog.action, n: count() })
    .from(activityLog)
    .where(and(eq(activityLog.orgId, user.orgId), eq(activityLog.actorId, user.id)))
    .groupBy(activityLog.action);
  return new Set(rows.filter((r) => Number(r.n) > 0).map((r) => r.action));
}

export async function tutorialTrack(user: SessionUser): Promise<{ flow: Flow; steps: TrackStep[] }> {
  const flow = flowFor(user.role, user.focus);
  const done: Partial<Record<TrackStepId, boolean>> = {};

  if (flow === "admin") {
    // The owner's steps are about the workspace being set up, whoever did each part.
    const [org, nClients, nProjects, nTeam, nPortal, approvals] = await Promise.all([
      db.query.organizations.findFirst({ where: eq(organizations.id, user.orgId), columns: { logo: true } }),
      db.select({ n: count() }).from(clients).where(eq(clients.orgId, user.orgId)),
      db.select({ n: count() }).from(projects).where(eq(projects.orgId, user.orgId)),
      Promise.all([
        db.select({ n: count() }).from(users).where(and(eq(users.orgId, user.orgId), ne(users.role, "client"), ne(users.id, user.id))),
        db.select({ n: count() }).from(invitations).where(and(eq(invitations.orgId, user.orgId), ne(invitations.role, "client"), isNull(invitations.acceptedAt))),
      ]),
      Promise.all([
        db.select({ n: count() }).from(users).where(and(eq(users.orgId, user.orgId), eq(users.role, "client"))),
        db.select({ n: count() }).from(invitations).where(and(eq(invitations.orgId, user.orgId), eq(invitations.role, "client"), isNull(invitations.acceptedAt))),
      ]),
      db
        .select({ action: activityLog.action, n: count() })
        .from(activityLog)
        .where(and(eq(activityLog.orgId, user.orgId), inArray(activityLog.action, ["brand.updated", "approval.requested"])))
        .groupBy(activityLog.action),
    ]);
    const logged = new Set(approvals.filter((r) => Number(r.n) > 0).map((r) => r.action));
    done.brand = !!org?.logo || logged.has("brand.updated");
    done.client = n(nClients) > 0;
    done.project = n(nProjects) > 0;
    done.team = n(nTeam[0]) + n(nTeam[1]) > 0;
    done.portal = n(nPortal[0]) + n(nPortal[1]) > 0;
    done.approval = logged.has("approval.requested");
  } else {
    const [mine, team, project, read] = await Promise.all([
      myActions(user),
      db.select({ n: count() }).from(teamMessages).where(and(eq(teamMessages.orgId, user.orgId), eq(teamMessages.authorId, user.id))),
      db.select({ n: count() }).from(chatMessages).where(and(eq(chatMessages.orgId, user.orgId), eq(chatMessages.authorId, user.id))),
      db.select({ n: count() }).from(notifications).where(and(eq(notifications.userId, user.id), isNotNull(notifications.readAt))),
    ]);
    done.status = mine.has("task.status");
    done.comment = mine.has("comment.added");
    done.file = mine.has("file.uploaded");
    done.approval = mine.has("approval.requested");
    done.decide = mine.has("approval.approved") || mine.has("approval.rejected");
    done.chat = n(team) + n(project) > 0;
    done.updates = n(read) > 0;
  }

  return { flow, steps: TRACK_STEPS[flow].map((s) => ({ id: s.id, href: s.href, done: !!done[s.id] })) };
}
