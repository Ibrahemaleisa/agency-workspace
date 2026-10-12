import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  activityLog,
  attachments,
  chatMessages,
  checklistItems,
  clients,
  clientTeam,
  invoices,
  leads,
  moduleTemplates,
  organizations,
  projectMembers,
  projectModules,
  projects,
  subscriptions,
  taskComments,
  tasks,
  teamMessages,
  timeEntries,
  users,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/export — everything in the signed-in admin's workspace as one JSON file (data
 * portability). Works on a locked workspace too: an agency that stops paying can still take its data.
 * Files are listed with their download path (/api/files/{id}); password hashes and tokens are never included.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.readOnly || !can(user, "users.manage")) return new Response("Not found", { status: 404 });
  if (!(await rateLimit(`export:${user.orgId}`, 10, 3600))) return new Response("Too many exports, try again later.", { status: 429 });
  const orgId = user.orgId;

  const org = await db.query.organizations.findFirst({ where: eq(organizations.id, orgId) });
  if (!org) return new Response("Not found", { status: 404 });
  const projectRows = await db.select().from(projects).where(eq(projects.orgId, orgId));
  const projectIds = new Set(projectRows.map((p) => p.id));
  const [
    people,
    clientRows,
    clientTeams,
    members,
    modules,
    templates,
    taskRows,
    checklist,
    comments,
    files,
    time,
    chat,
    team,
    leadRows,
    activity,
    sub,
    invoiceRows,
  ] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        title: users.title,
        clientId: users.clientId,
        active: users.active,
        lang: users.lang,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.orgId, orgId)),
    db.select().from(clients).where(eq(clients.orgId, orgId)),
    db.select({ clientId: clientTeam.clientId, userId: clientTeam.userId }).from(clientTeam).innerJoin(clients, eq(clients.id, clientTeam.clientId)).where(eq(clients.orgId, orgId)),
    db.select({ projectId: projectMembers.projectId, userId: projectMembers.userId }).from(projectMembers).innerJoin(projects, eq(projects.id, projectMembers.projectId)).where(eq(projects.orgId, orgId)),
    db.select().from(projectModules).where(eq(projectModules.orgId, orgId)),
    db.select().from(moduleTemplates).where(eq(moduleTemplates.orgId, orgId)),
    db.select().from(tasks).where(eq(tasks.orgId, orgId)),
    db.select().from(checklistItems).where(eq(checklistItems.orgId, orgId)),
    db.select().from(taskComments).where(eq(taskComments.orgId, orgId)),
    db
      .select({
        id: attachments.id,
        taskId: attachments.taskId,
        uploaderId: attachments.uploaderId,
        fileName: attachments.fileName,
        mimeType: attachments.mimeType,
        size: attachments.size,
        clientVisible: attachments.clientVisible,
        createdAt: attachments.createdAt,
      })
      .from(attachments)
      .where(eq(attachments.orgId, orgId)),
    db.select().from(timeEntries).where(eq(timeEntries.orgId, orgId)),
    db.select().from(chatMessages).where(eq(chatMessages.orgId, orgId)),
    db.select().from(teamMessages).where(eq(teamMessages.orgId, orgId)),
    db.select().from(leads).where(eq(leads.orgId, orgId)),
    db.select().from(activityLog).where(eq(activityLog.orgId, orgId)),
    db.query.subscriptions.findFirst({ where: eq(subscriptions.orgId, orgId) }),
    db.select().from(invoices).where(eq(invoices.orgId, orgId)),
  ]);

  const { logo: _logo, ...orgFields } = org;
  void _logo;
  const body = JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      exportedBy: user.email,
      format: "operra-workspace-export/1",
      workspace: orgFields,
      subscription: sub ? { planCode: sub.planCode, status: sub.status, trialEndsAt: sub.trialEndsAt, currentPeriodEnd: sub.currentPeriodEnd } : null,
      invoices: invoiceRows,
      people,
      clients: clientRows,
      clientTeams,
      projects: projectRows,
      projectMembers: members.filter((m) => projectIds.has(m.projectId)),
      projectModules: modules,
      moduleTemplates: templates,
      tasks: taskRows,
      checklistItems: checklist,
      comments,
      files: files.map((f) => ({ ...f, download: `/api/files/${f.id}` })),
      timeEntries: time,
      projectChat: chat,
      teamChat: team,
      leads: leadRows,
      activity,
    },
    null,
    2,
  );
  const day = new Date().toISOString().slice(0, 10);
  return new Response(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${org.slug}-export-${day}.json"`,
      "Cache-Control": "private, no-store",
    },
  });
}
