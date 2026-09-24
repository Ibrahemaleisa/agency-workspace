import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { PROJECT_STATUSES } from "@/lib/constants";
import { listProjects } from "@/server/queries";
import { ProjectGrid } from "@/components/lists";
import { FilterTabs, SearchBox } from "@/components/filters";
import { LinkButton, PageHeader } from "@/components/ui";
import { Plus } from "lucide-react";
import { getT } from "@/lib/lang";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t.projects.title };
}

export default async function ProjectsPage({ searchParams }: PageProps<"/projects">) {
  const user = await requireUser();
  const { t } = await getT();
  const sp = await searchParams;
  const status = typeof sp.status === "string" ? sp.status : "open";
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const projects = await listProjects(user, { status: status === "all" ? undefined : status, q });

  return (
    <>
      <PageHeader
        title={t.projects.title}
        description={user.role === "client" ? t.projects.subtitleClient : t.projects.subtitleStaff}
        actions={
          can(user, "projects.manage") && (
            <LinkButton href="/projects/new">
              <Plus className="size-4" /> {t.projects.newProject}
            </LinkButton>
          )
        }
      />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <FilterTabs
          current={status}
          options={[
            { value: "open", label: t.common.open },
            ...PROJECT_STATUSES.map((s) => ({ value: s.value, label: t.projectStatus[s.value] })),
            { value: "all", label: t.common.all },
          ]}
          hrefFor={(v) => `/projects?status=${v}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
        />
        <SearchBox defaultValue={q} placeholder={t.projects.searchPlaceholder} hidden={{ status }} />
      </div>
      <ProjectGrid projects={projects} showClient={user.role !== "client"} />
    </>
  );
}
