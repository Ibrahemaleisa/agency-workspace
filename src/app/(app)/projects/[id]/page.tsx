import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  chatMessages,
  clients,
  moduleTemplates,
  projectMembers,
  projectModules,
  tasks,
  users,
  type Project,
  type ProjectModule,
} from "@/db/schema";
import { requireUser, type SessionUser } from "@/lib/auth";
import { getAccessibleProject } from "@/lib/access";
import { getT } from "@/lib/lang";
import { can } from "@/lib/permissions";
import { TASK_STATUSES } from "@/lib/constants";
import { summarizeModule } from "@/lib/modules";
import { listActivity, listInternalUsers, listTasks } from "@/server/queries";
import { addModule, removeModule, updateModuleFields, updateProject } from "@/server/project-actions";
import { ActivityFeed, TaskBoard, TaskTable } from "@/components/lists";
import { Columns3, List, Plus } from "lucide-react";
import { ModuleCard } from "@/components/module-card";
import { ProjectChat } from "@/components/project-chat";
import { ProjectForm } from "@/components/project-form";
import { TaskCreateForm } from "@/components/task-create-form";
import { FilterTabs } from "@/components/filters";
import { ActionForm, ConfirmSubmit, SubmitButton } from "@/components/forms";
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  PageHeader,
  ProgressBar,
  Select,
  Textarea,
  cn,
  formatDate,
} from "@/components/ui";
import { ProjectStatusBadge } from "@/components/labels";

type Tab = "overview" | "tasks" | "chat" | "activity" | "settings";

export default async function ProjectPage({ params, searchParams }: PageProps<"/projects/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const sp = await searchParams;
  const project = await getAccessibleProject(user, id);
  const { t: tr, locale } = await getT();

  const tabs: { value: Tab; label: string }[] = [
    { value: "overview", label: tr.projects.tabs.overview },
    { value: "tasks", label: tr.projects.tabs.tasks },
    { value: "chat", label: tr.projects.tabs.chat },
    { value: "activity", label: tr.projects.tabs.activity },
  ];
  if (can(user, "projects.manage")) tabs.push({ value: "settings", label: tr.projects.tabs.settings });
  const tab = (tabs.find((t) => t.value === sp.tab)?.value ?? "overview") as Tab;

  const [client, modules, allTasks, members, owner] = await Promise.all([
    db.query.clients.findFirst({ where: eq(clients.id, project.clientId) }),
    db.select().from(projectModules).where(eq(projectModules.projectId, project.id)).orderBy(asc(projectModules.position)),
    db
      .select({ moduleId: tasks.moduleId, stage: tasks.stage, status: tasks.status })
      .from(tasks)
      .where(eq(tasks.projectId, project.id)),
    db
      .select({ id: users.id, name: users.name, title: users.title })
      .from(projectMembers)
      .innerJoin(users, eq(users.id, projectMembers.userId))
      .where(eq(projectMembers.projectId, project.id))
      .orderBy(asc(users.name)),
    project.ownerId ? db.query.users.findFirst({ where: eq(users.id, project.ownerId) }) : null,
  ]);

  const done = allTasks.filter((t) => t.status === "completed").length;
  const progress = allTasks.length ? Math.round((done / allTasks.length) * 100) : 0;

  return (
    <>
      <PageHeader
        breadcrumb={[
          { href: "/projects", label: tr.projects.title },
          ...(can(user, "clients.view") && client ? [{ href: `/clients/${client.id}`, label: client.name }] : []),
        ]}
        title={
          <span className="flex flex-wrap items-center gap-2">
            {project.name} <ProjectStatusBadge status={project.status} />
          </span>
        }
        description={project.description}
      />

      <div className="mb-5 grid grid-cols-2 gap-4 rounded-xl border border-zinc-200/80 bg-white p-4 text-sm shadow-[0_1px_2px_rgb(0_0_0/0.04)] md:grid-cols-5 md:p-5">
        <Meta label={tr.common.client}>{client?.name}</Meta>
        <Meta label={tr.projects.timeline}>
          {formatDate(project.startDate, "MMM d", locale)} – {formatDate(project.endDate, "MMM d, yyyy", locale)}
        </Meta>
        <Meta label={tr.common.owner}>{owner?.name ?? "—"}</Meta>
        <Meta label={tr.projects.team}>
          <span className="flex -space-x-1 rtl:space-x-reverse">
            {members.slice(0, 6).map((m) => (
              <span key={m.id} className="rounded-full ring-2 ring-white">
                <Avatar name={m.name} />
              </span>
            ))}
            {members.length === 0 && "—"}
          </span>
        </Meta>
        <Meta label={tr.common.progress}>
          <span className="flex items-center gap-2">
            <ProgressBar value={progress} />
            <span className="text-xs tabular-nums">{progress}%</span>
          </span>
        </Meta>
      </div>

      <nav className="no-scrollbar -mx-4 mb-5 flex gap-1 overflow-x-auto border-b border-zinc-200 px-4 md:mx-0 md:px-0">
        {tabs.map((t) => (
          <Link
            key={t.value}
            href={`/projects/${project.id}?tab=${t.value}`}
            className={cn(
              "-mb-px shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap",
              t.value === tab ? "border-indigo-600 text-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-900",
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === "overview" && <OverviewTab user={user} project={project} modules={modules} allTasks={allTasks} />}
      {tab === "tasks" && (
        <TasksTab
          user={user}
          project={project}
          modules={modules}
          status={typeof sp.status === "string" ? sp.status : "open"}
          view={sp.view === "list" ? "list" : "board"}
        />
      )}
      {tab === "chat" && <ChatTab user={user} project={project} channel={sp.channel === "internal" ? "internal" : sp.channel === "client" ? "client" : undefined} />}
      {tab === "activity" && (
        <Card padded={false}>
          <ActivityFeed items={await listActivity(user, { projectId: project.id, limit: 100 })} showProject={false} />
        </Card>
      )}
      {tab === "settings" && can(user, "projects.manage") && (
        <SettingsTab user={user} project={project} modules={modules} memberIds={members.map((m) => m.id)} />
      )}
    </>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="mt-0.5 truncate font-medium text-zinc-900">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

async function OverviewTab({
  user,
  project,
  modules,
  allTasks,
}: {
  user: SessionUser;
  project: Project;
  modules: ProjectModule[];
  allTasks: { moduleId: string | null; stage: string | null; status: (typeof TASK_STATUSES)[number]["value"] }[];
}) {
  const { t: tr } = await getT();
  const visible = await listTasks(user, { projectId: project.id });
  const general = visible.filter((t) => !t.moduleId);
  const templates = can(user, "projects.manage")
    ? await db.select().from(moduleTemplates).where(eq(moduleTemplates.orgId, user.orgId)).orderBy(asc(moduleTemplates.name))
    : [];

  return (
    <div className="space-y-5">
      {modules.length === 0 && (
        <Card>
          <EmptyState>
            {tr.projects.noModules} {can(user, "projects.manage") && tr.projects.addModuleHint}
          </EmptyState>
        </Card>
      )}
      {modules.map((m) => (
        <ModuleCard
          key={m.id}
          mod={m}
          allTasks={allTasks.filter((t) => t.moduleId === m.id)}
          visibleTasks={visible.filter((t) => t.moduleId === m.id)}
          editableStatus={can(user, "tasks.updateStatus")}
        />
      ))}
      {general.length > 0 && (
        <Card title={tr.projects.generalTasks} padded={false}>
          <TaskTable tasks={general} showProject={false} editableStatus={can(user, "tasks.updateStatus")} />
        </Card>
      )}
      {templates.length > 0 && (
        <form action={addModule} className="flex flex-wrap items-end gap-2 rounded-xl border border-dashed border-zinc-300 bg-white/50 p-4">
          <input type="hidden" name="projectId" value={project.id} />
          <Field label={tr.projects.addModuleLabel} className="w-64">
            <Select name="templateId" required options={templates.map((t) => ({ value: t.id, label: t.name }))} />
          </Field>
          <Button variant="secondary">{tr.projects.addModule}</Button>
          <span className="text-xs text-zinc-500">{tr.projects.addModuleNote}</span>
        </form>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

async function TasksTab({
  user,
  project,
  modules,
  status,
  view,
}: {
  user: SessionUser;
  project: Project;
  modules: ProjectModule[];
  status: string;
  view: "board" | "list";
}) {
  const { t: tr } = await getT();
  const all = await listTasks(user, { projectId: project.id });
  const shown =
    status === "all" ? all : status === "open" ? all.filter((t) => t.status !== "completed") : all.filter((t) => t.status === status);
  const people = can(user, "tasks.create") ? await listInternalUsers(user.orgId) : [];

  return (
    <div className="space-y-5">
      {can(user, "tasks.create") && (
        <details className="group rounded-xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold text-indigo-600 select-none">
            <Plus className="size-4 transition group-open:rotate-45" /> {tr.projects.newTask}
          </summary>
          <div className="border-t border-zinc-100 p-4">
            <TaskCreateForm
              projectId={project.id}
              modules={modules}
              people={people}
              canAssign={can(user, "tasks.assign")}
              canShare={can(user, "tasks.setClientVisibility")}
              defaultAssigneeId={user.id}
            />
          </div>
        </details>
      )}
      <div className="flex items-center justify-between gap-3">
        <div className="flex rounded-lg bg-zinc-200/60 p-0.5">
          {(["board", "list"] as const).map((v) => (
            <Link
              key={v}
              href={`/projects/${project.id}?tab=tasks&view=${v}`}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium",
                view === v ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800",
              )}
            >
              {v === "board" ? <Columns3 className="size-4" /> : <List className="size-4" />}
              {v === "board" ? tr.lists.board : tr.lists.list}
            </Link>
          ))}
        </div>
        <span className="text-xs text-zinc-500">{tr.lists.tasksCount(all.length)}</span>
      </div>
      {view === "board" ? (
        <TaskBoard tasks={all} editableStatus={can(user, "tasks.updateStatus")} />
      ) : (
        <>
          <FilterTabs
            current={status}
            options={[
              { value: "open", label: tr.common.open, count: all.filter((t) => t.status !== "completed").length },
              ...TASK_STATUSES.map((s) => ({ value: s.value, label: tr.taskStatus[s.value], count: all.filter((t) => t.status === s.value).length })),
              { value: "all", label: tr.common.all, count: all.length },
            ]}
            hrefFor={(v) => `/projects/${project.id}?tab=tasks&view=list&status=${v}`}
          />
          <Card padded={false}>
            <TaskTable tasks={shown} showProject={false} editableStatus={can(user, "tasks.updateStatus")} />
          </Card>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

async function ChatTab({
  user,
  project,
  channel: requested,
}: {
  user: SessionUser;
  project: Project;
  channel?: "internal" | "client";
}) {
  const channels = (["internal", "client"] as const).filter((c) => can(user, c === "internal" ? "chat.internal" : "chat.client"));
  const channel = requested && channels.includes(requested) ? requested : channels[0];
  const messages = await db
    .select({
      id: chatMessages.id,
      body: chatMessages.body,
      createdAt: chatMessages.createdAt,
      authorName: users.name,
      authorRole: users.role,
    })
    .from(chatMessages)
    .leftJoin(users, eq(users.id, chatMessages.authorId))
    .where(and(eq(chatMessages.projectId, project.id), eq(chatMessages.channel, channel)))
    .orderBy(asc(chatMessages.createdAt))
    .limit(300);
  return (
    <ProjectChat
      projectId={project.id}
      channel={channel}
      channels={[...channels]}
      messages={messages}
      currentUserName={user.name}
    />
  );
}

/* ------------------------------------------------------------------ */

async function SettingsTab({
  user,
  project,
  modules,
  memberIds,
}: {
  user: SessionUser;
  project: Project;
  modules: ProjectModule[];
  memberIds: string[];
}) {
  const { t: tr } = await getT();
  const people = await listInternalUsers(user.orgId);
  const moduleTasks = await db
    .select({ moduleId: tasks.moduleId, stage: tasks.stage, status: tasks.status })
    .from(tasks)
    .where(eq(tasks.projectId, project.id));

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card title={tr.projects.projectDetails} className="lg:col-span-3">
        <ProjectForm action={updateProject} project={project} people={people} memberIds={memberIds} submitLabel={tr.projectForm.saveChanges} />
      </Card>
      <div className="min-w-0 space-y-4 lg:col-span-2">
        {modules.length === 0 && (
          <Card>
            <EmptyState>{tr.projects.noModulesSettings}</EmptyState>
          </Card>
        )}
        {modules.map((m) => {
          const s = summarizeModule(m, moduleTasks.filter((t) => t.moduleId === m.id));
          return (
            <Card
              key={m.id}
              title={
                <span className="flex items-center gap-2">
                  <Badge tone={m.color}>{m.name}</Badge>
                  <span className="text-xs font-normal text-zinc-500">{tr.lists.tasksCount(s.total)}</span>
                </span>
              }
              actions={
                <form action={removeModule}>
                  <input type="hidden" name="projectId" value={project.id} />
                  <input type="hidden" name="moduleId" value={m.id} />
                  <ConfirmSubmit message={tr.projects.removeModuleConfirm(m.name, s.total)}>{tr.common.remove}</ConfirmSubmit>
                </form>
              }
            >
              <ActionForm action={updateModuleFields} className="space-y-3" successMessage={tr.common.saved}>
                <input type="hidden" name="projectId" value={project.id} />
                <input type="hidden" name="moduleId" value={m.id} />
                {m.fields.map((f) => (
                  <Field key={f.key} label={f.label}>
                    {f.type === "select" ? (
                      <Select
                        name={`field_${f.key}`}
                        defaultValue={m.fieldValues[f.key] ?? ""}
                        placeholder="—"
                        options={(f.options ?? []).map((o) => ({ value: o, label: o }))}
                      />
                    ) : f.type === "textarea" ? (
                      <Textarea name={`field_${f.key}`} rows={2} defaultValue={m.fieldValues[f.key] ?? ""} />
                    ) : (
                      <Input type={f.type} name={`field_${f.key}`} defaultValue={m.fieldValues[f.key] ?? ""} />
                    )}
                  </Field>
                ))}
                {m.fields.length === 0 && <p className="text-sm text-zinc-500">{tr.projects.noCustomFields}</p>}
                <div className="flex justify-end">
                  <SubmitButton size="sm" variant="secondary">
                    {tr.projects.saveModuleDetails(m.name)}
                  </SubmitButton>
                </div>
              </ActionForm>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
