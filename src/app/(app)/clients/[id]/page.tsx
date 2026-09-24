import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { clients, clientTeam, users } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { isUuid } from "@/lib/access";
import { getT } from "@/lib/lang";
import { can } from "@/lib/permissions";
import { updateClient } from "@/server/admin-actions";
import { listInternalUsers, listProjects } from "@/server/queries";
import { ClientForm } from "@/components/client-form";
import { ProjectTable } from "@/components/lists";
import {
  Card,
  EmptyState,
  LinkButton,
  PageHeader,
} from "@/components/ui";
import { Person } from "@/components/labels";

export default async function ClientPage({ params }: PageProps<"/clients/[id]">) {
  const user = await requirePermission("clients.view");
  const { t } = await getT();
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const client = await db.query.clients.findFirst({ where: and(eq(clients.id, id), eq(clients.orgId, user.orgId)) });
  if (!client) notFound();

  const [projectRows, team, portalUsers, people] = await Promise.all([
    listProjects(user, { clientId: client.id }),
    db
      .select({ id: users.id, name: users.name, title: users.title })
      .from(clientTeam)
      .innerJoin(users, eq(users.id, clientTeam.userId))
      .where(eq(clientTeam.clientId, client.id)),
    db
      .select({ id: users.id, name: users.name, email: users.email, active: users.active })
      .from(users)
      .where(and(eq(users.clientId, client.id), eq(users.role, "client"))),
    listInternalUsers(user.orgId),
  ]);

  return (
    <>
      <PageHeader
        title={client.name}
        description={[client.industry, client.website].filter(Boolean).join(" · ")}
        breadcrumb={[{ href: "/clients", label: t.clients.title }]}
        actions={
          can(user, "projects.manage") && (
            <LinkButton href={`/projects/new?clientId=${client.id}`}>{t.projects.newProject}</LinkButton>
          )
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <Card title={t.projects.title} padded={false}>
            <ProjectTable projects={projectRows} showClient={false} />
          </Card>
          {can(user, "clients.manage") && (
            <Card title={t.clients.editClient}>
              <ClientForm
                action={updateClient}
                client={client}
                people={people}
                teamIds={team.map((t) => t.id)}
                submitLabel={t.clientForm.save}
              />
            </Card>
          )}
        </div>
        <div className="min-w-0 space-y-6">
          <Card title={t.clients.contact}>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-xs text-zinc-500">{t.clients.name}</dt><dd>{client.contactName ?? "—"}</dd></div>
              <div><dt className="text-xs text-zinc-500">{t.clients.email}</dt><dd>{client.contactEmail ?? "—"}</dd></div>
              <div><dt className="text-xs text-zinc-500">{t.clients.phone}</dt><dd>{client.phone ?? "—"}</dd></div>
            </dl>
            {client.notes && (
              <div className="mt-3 rounded-md bg-amber-50 p-3 text-sm text-amber-900">
                <div className="mb-1 text-xs font-medium">{t.clients.internalNotes}</div>
                <p className="whitespace-pre-wrap">{client.notes}</p>
              </div>
            )}
          </Card>
          <Card title={t.clients.assignedTeam} padded={false}>
            {team.length === 0 ? (
              <EmptyState>{t.clients.noTeam}</EmptyState>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {team.map((t) => (
                  <li key={t.id} className="flex items-center justify-between px-4 py-2">
                    <Person name={t.name} />
                    <span className="text-xs text-zinc-500">{t.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card
            title={t.clients.portalUsers}
            padded={false}
            actions={can(user, "users.manage") && <LinkButton href="/team" size="sm" variant="secondary">{t.clients.manage}</LinkButton>}
          >
            {portalUsers.length === 0 ? (
              <EmptyState>{t.clients.noPortal}</EmptyState>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {portalUsers.map((u) => (
                  <li key={u.id} className="px-4 py-2 text-sm">
                    <div className="font-medium">{u.name} {!u.active && <span className="text-xs text-zinc-400">({t.common.inactive})</span>}</div>
                    <div className="text-xs text-zinc-500">{u.email}</div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
