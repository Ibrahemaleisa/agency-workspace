import Link from "next/link";
import { Building2, Search } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getT } from "@/lib/lang";
import { listProjects, listTasks, searchClients } from "@/server/queries";
import { ProjectTable, TaskTable } from "@/components/lists";
import { Card, PageHeader } from "@/components/ui";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t.search.title };
}

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const user = await requireUser();
  const { t } = await getT();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 200) : "";

  const [tasks, projects, clients] = q
    ? await Promise.all([
        listTasks(user, { q, limit: 50, orderBy: "updated" }),
        listProjects(user, { q }),
        can(user, "clients.view") ? searchClients(user, q) : Promise.resolve([]),
      ])
    : [[], [], []];
  const total = tasks.length + projects.length + clients.length;

  return (
    <>
      <PageHeader title={t.search.title} description={q ? t.search.results(total) : t.search.prompt} />
      <form role="search" className="relative mb-6 max-w-2xl">
        <Search className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-zinc-400" />
        <input
          name="q"
          type="search"
          defaultValue={q}
          autoFocus={!q}
          placeholder={t.search.placeholder}
          className="block w-full rounded-full border-0 bg-white py-3 ps-12 pe-5 text-base shadow-sm ring-1 ring-zinc-200 ring-inset placeholder:text-zinc-400 focus:ring-2 focus:ring-ink focus:outline-none"
        />
      </form>

      {q && total === 0 && (
        <p className="rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-10 text-center text-sm text-zinc-500">
          {t.search.noResults(q)}
        </p>
      )}

      <div className="space-y-6">
        {clients.length > 0 && (
          <Card title={`${t.search.clients} (${clients.length})`} padded={false}>
            <ul className="divide-y divide-zinc-100">
              {clients.map((c) => (
                <li key={c.id}>
                  <Link href={`/clients/${c.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50">
                    <span className="rounded-md bg-sand-100 p-1.5 text-ink">
                      <Building2 className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{c.name}</span>
                      <span className="block text-xs text-zinc-500">{[c.industry, c.contactName].filter(Boolean).join(" · ")}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}
        {projects.length > 0 && (
          <Card title={`${t.search.projects} (${projects.length})`} padded={false}>
            <ProjectTable projects={projects} showClient={user.role !== "client"} />
          </Card>
        )}
        {tasks.length > 0 && (
          <Card title={`${t.search.tasks} (${tasks.length})`} padded={false}>
            <TaskTable tasks={tasks} showAssignee={user.role !== "client"} />
          </Card>
        )}
      </div>
    </>
  );
}
