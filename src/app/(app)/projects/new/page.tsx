import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { moduleTemplates } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { createProject } from "@/server/project-actions";
import { listClientsForOrg, listInternalUsers } from "@/server/queries";
import { ProjectForm } from "@/components/project-form";
import { Card, PageHeader } from "@/components/ui";
import { getT } from "@/lib/lang";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t.projects.newProject };
}

export default async function NewProjectPage({ searchParams }: PageProps<"/projects/new">) {
  const user = await requirePermission("projects.manage");
  const { t } = await getT();
  const sp = await searchParams;
  const [clients, people, templates] = await Promise.all([
    listClientsForOrg(user.orgId),
    listInternalUsers(user.orgId),
    db.select().from(moduleTemplates).where(eq(moduleTemplates.orgId, user.orgId)).orderBy(asc(moduleTemplates.createdAt)),
  ]);
  return (
    <>
      <PageHeader
        title={t.projects.newProject}
        breadcrumb={[{ href: "/projects", label: t.projects.title }]}
        description={t.projects.newProjectHint}
      />
      <Card className="max-w-3xl">
        <ProjectForm
          action={createProject}
          clients={clients}
          people={people}
          memberIds={[user.id]}
          defaultOwnerId={user.id}
          templates={templates}
          defaultClientId={typeof sp.clientId === "string" ? sp.clientId : undefined}
          submitLabel={t.projectForm.create}
        />
      </Card>
    </>
  );
}
