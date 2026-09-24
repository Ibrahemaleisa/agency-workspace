import Link from "next/link";
import type { Metadata } from "next";
import {
  AlarmClock,
  AlertTriangle,
  BadgeCheck,
  Eye,
  FolderKanban,
  Grid3x3,
  Inbox,
  ListTodo,
  Percent,
  UserX,
} from "lucide-react";
import { requireUser, type SessionUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { TASK_STATUSES } from "@/lib/constants";
import { getT } from "@/lib/lang";
import type { AppDict } from "@/lib/i18n-app";
import type { Lang } from "@/lib/i18n";
import {
  listActivity,
  listProjects,
  listTasks,
  projectMatrix,
  taskCountsByStatus,
  teamWorkload,
} from "@/server/queries";
import { ActivityFeed, ProjectGrid, TaskTable } from "@/components/lists";
import { ProjectMatrix } from "@/components/project-matrix";
import {
  Avatar,
  Card,
  EmptyState,
  PageHeader,
  ProgressBar,
  Stat,
  cn,
  toneDot,
} from "@/components/ui";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.nav.dashboard };
}

export default async function DashboardPage() {
  const user = await requireUser();
  const { t, lang } = await getT();
  const props = { user, t, lang };
  if (can(user, "dashboard.admin")) return <AdminDashboard {...props} />;
  if (can(user, "dashboard.client")) return <ClientDashboard {...props} />;
  return <EmployeeDashboard {...props} />;
}

type Props = { user: SessionUser; t: AppDict; lang: Lang };

/* ------------------------------------------------------------------ */

async function AdminDashboard({ user, t, lang }: Props) {
  const d = t.dashboard;
  const [openProjects, overdueAll, approvalsAll, unassignedTasks, byStatus, workload, activity, matrix] =
    await Promise.all([
      listProjects(user, { status: "open" }),
      listTasks(user, { overdue: true }),
      listTasks(user, { approvalPending: true }),
      listTasks(user, { assigneeId: null, status: "open" }),
      taskCountsByStatus(user),
      teamWorkload(user),
      listActivity(user, { limit: 12 }),
      projectMatrix(user),
    ]);
  const active = openProjects.filter((p) => p.status === "active");
  const overdue = overdueAll.slice(0, 8);
  const approvals = approvalsAll.slice(0, 8);

  return (
    <>
      <PageHeader title={d.greeting(greetingPart(), firstName(user))} description={`${today(lang)} · ${d.agencyOverview}`} />
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-5">
        <Stat label={d.activeProjects} value={active.length} href="/projects?status=active" tone="slate" icon={<FolderKanban className="size-4" />} />
        <Stat label={d.overdueTasks} value={overdueAll.length} tone={overdueAll.length ? "red" : "slate"} href="/tasks?view=overdue" icon={<AlertTriangle className="size-4" />} />
        <Stat label={d.pendingApprovals} value={approvalsAll.length} tone={approvalsAll.length ? "amber" : "slate"} href="/approvals" icon={<BadgeCheck className="size-4" />} />
        <Stat label={d.inReview} value={byStatus.review ?? 0} tone="violet" href="/tasks?status=review" icon={<Eye className="size-4" />} />
        <Stat label={d.unassigned} value={unassignedTasks.length} href="/tasks?view=unassigned" icon={<UserX className="size-4" />} hint={d.unassignedHint} />
      </div>

      <Card title={<CardTitle icon={<Grid3x3 className="size-4 text-zinc-500" />}>{t.matrix.title}</CardTitle>} className="mt-6" padded={false}>
        <p className="-mt-1 px-4 pb-1 text-xs text-zinc-500 md:px-5">{t.matrix.subtitle}</p>
        <ProjectMatrix rows={matrix} t={t} />
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card title={d.tasksByStatus} className="lg:col-span-1">
          <StatusBars counts={byStatus} t={t} />
        </Card>
        <Card title={d.teamWorkload} className="lg:col-span-2" padded={false}>
          <WorkloadBars rows={workload} t={t} />
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <Card title={<CardTitle icon={<AlertTriangle className="size-4 text-red-500" />}>{d.overdueTasks}</CardTitle>} actions={<SeeAll href="/tasks?view=overdue" t={t} />} padded={false}>
            <TaskTable tasks={overdue} showProject={false} empty={d.nothingOverdue} />
          </Card>
          <Card title={<CardTitle icon={<BadgeCheck className="size-4 text-amber-500" />}>{d.waitingOnClient}</CardTitle>} actions={<SeeAll href="/approvals" t={t} />} padded={false}>
            <TaskTable tasks={approvals} showProject={false} empty={d.noApprovals} />
          </Card>
        </div>
        <Card title={d.recentActivity} actions={<SeeAll href="/activity" t={t} />} padded={false}>
          <ActivityFeed items={activity} />
        </Card>
      </div>

      <SectionHeading title={d.openProjects} action={<SeeAll href="/projects" t={t} />} />
      <ProjectGrid projects={openProjects.slice(0, 6)} />
    </>
  );
}

/* ------------------------------------------------------------------ */

async function EmployeeDashboard({ user, t, lang }: Props) {
  const d = t.dashboard;
  const [mine, dueToday, overdue, review, activity, myProjects, matrix] = await Promise.all([
    listTasks(user, { assigneeId: user.id, status: "open" }),
    listTasks(user, { assigneeId: user.id, dueToday: true }),
    listTasks(user, { assigneeId: user.id, overdue: true }),
    listTasks(user, { status: "review" }),
    listActivity(user, { limit: 10 }),
    listProjects(user, { status: "open" }),
    projectMatrix(user),
  ]);
  // "Waiting for me": items in review I created/own + my tasks where the client asked for changes.
  const waitingForMe = [
    ...review.filter((x) => x.assigneeId !== user.id),
    ...mine.filter((x) => x.approvalStatus === "rejected"),
  ];
  const clientWaiting = mine.filter((x) => x.status === "waiting_client");

  return (
    <>
      <PageHeader title={d.greeting(greetingPart(), firstName(user))} description={`${today(lang)} · ${d.needsAttention}`} />
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <Stat label={d.myOpenTasks} value={mine.length} href="/tasks" tone="slate" icon={<ListTodo className="size-4" />} />
        <Stat label={d.dueToday} value={dueToday.length} tone={dueToday.length ? "amber" : "slate"} href="/tasks?view=today" icon={<AlarmClock className="size-4" />} />
        <Stat label={d.overdue} value={overdue.length} tone={overdue.length ? "red" : "slate"} href="/tasks?view=overdue" icon={<AlertTriangle className="size-4" />} />
        <Stat label={d.waitingForMe} value={waitingForMe.length} tone="violet" hint={d.waitingHint} icon={<Inbox className="size-4" />} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          {(overdue.length > 0 || dueToday.length > 0) && (
            <Card title={d.dueTodayOverdue} padded={false}>
              <TaskTable tasks={[...overdue, ...dueToday]} editableStatus showAssignee={false} />
            </Card>
          )}
          <Card title={d.waitingForMe} padded={false}>
            <TaskTable tasks={waitingForMe} editableStatus empty={d.nothingWaiting} />
          </Card>
          <Card title={d.myTasks} actions={<SeeAll href="/tasks" t={t} />} padded={false}>
            <TaskTable
              tasks={mine.filter((x) => x.status !== "waiting_client")}
              editableStatus
              showAssignee={false}
              empty={d.noOpenTasks}
            />
          </Card>
          {clientWaiting.length > 0 && (
            <Card title={d.blockedOnClient} padded={false}>
              <TaskTable tasks={clientWaiting} showAssignee={false} />
            </Card>
          )}
        </div>
        <div className="min-w-0 space-y-6">
          <Card title={d.myProjects} padded={false}>
            {myProjects.length === 0 ? (
              <EmptyState>{d.notOnProjects}</EmptyState>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {myProjects.map((p) => (
                  <li key={p.id} className="px-4 py-3">
                    <Link href={`/projects/${p.id}`} className="text-sm font-medium hover:text-indigo-600">
                      {p.name}
                    </Link>
                    <div className="text-xs text-zinc-500">{p.clientName}</div>
                    <ProgressBar value={p.progress} className="mt-2" />
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title={d.recentActivity} padded={false}>
            <ActivityFeed items={activity} />
          </Card>
        </div>
      </div>

      {matrix.length > 0 && (
        <Card title={<CardTitle icon={<Grid3x3 className="size-4 text-zinc-500" />}>{t.matrix.title}</CardTitle>} className="mt-6" padded={false}>
          <p className="-mt-1 px-4 pb-1 text-xs text-zinc-500 md:px-5">{t.matrix.subtitle}</p>
          <ProjectMatrix rows={matrix} t={t} />
        </Card>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */

async function ClientDashboard({ user, t, lang }: Props) {
  const d = t.dashboard;
  const [myProjects, approvals, activity] = await Promise.all([
    listProjects(user),
    listTasks(user, { approvalPending: true }),
    listActivity(user, { limit: 12 }),
  ]);
  const upcoming = myProjects.filter((p) => p.status === "active" || p.status === "planning");

  return (
    <>
      <PageHeader title={d.welcome(firstName(user))} description={`${today(lang)} · ${d.atAGlance}`} />

      {approvals.length > 0 && (
        <Link
          href="/approvals"
          className="mb-6 flex items-center gap-4 rounded-xl bg-ink p-4 text-white shadow-lg shadow-black/10 transition hover:shadow-xl md:p-5"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-sand-200 text-ink">
            <BadgeCheck className="size-6" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">{d.itemsWaiting(approvals.length)}</span>
            <span className="block text-sm text-zinc-400">{d.feedbackMoves}</span>
          </span>
          <span className="hidden rounded-lg bg-sand-200 px-3 py-2 text-sm font-semibold text-ink sm:block">{d.reviewNow}</span>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3">
        <Stat label={d.activeProjects} value={upcoming.length} tone="slate" icon={<FolderKanban className="size-4" />} />
        <Stat label={d.pendingApprovals} value={approvals.length} tone={approvals.length ? "amber" : "slate"} href="/approvals" icon={<BadgeCheck className="size-4" />} />
        <Stat
          label={d.overallProgress}
          tone="slate"
          icon={<Percent className="size-4" />}
          value={`${myProjects.length ? Math.round(myProjects.reduce((s, p) => s + p.progress, 0) / myProjects.length) : 0}%`}
        />
      </div>

      <SectionHeading title={d.yourProjects} />
      <ProjectGrid projects={myProjects} showClient={false} />

      <SectionHeading title={d.recentUpdates} />
      <Card padded={false}>
        <ActivityFeed items={activity} empty={d.noUpdates} />
      </Card>
    </>
  );
}

/* ------------------------------------------------------------------ */

function StatusBars({ counts, t }: { counts: Record<string, number | undefined>; t: AppDict }) {
  const total = TASK_STATUSES.reduce((s, x) => s + (counts[x.value] ?? 0), 0);
  const max = Math.max(1, ...TASK_STATUSES.map((s) => counts[s.value] ?? 0));
  return (
    <div className="space-y-3">
      {TASK_STATUSES.map((s) => {
        const n = counts[s.value] ?? 0;
        const label = t.taskStatus[s.value];
        return (
          <Link
            key={s.value}
            href={`/tasks?status=${s.value}`}
            className="group block"
            title={`${label}: ${n} (${total ? Math.round((n / total) * 100) : 0}%)`}
          >
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-zinc-600 group-hover:text-zinc-900">
                <span className={cn("size-2 rounded-full", toneDot[s.tone])} />
                {label}
              </span>
              <span className="font-medium text-zinc-900 tabular-nums">{n}</span>
            </div>
            <div className="h-2 rounded-e bg-zinc-100">
              <div className={cn("h-2 rounded-e", toneDot[s.tone])} style={{ width: `${(n / max) * 100}%` }} />
            </div>
          </Link>
        );
      })}
      <div className="border-t border-zinc-100 pt-2 text-xs text-zinc-500">{t.dashboard.tasksAcross(total)}</div>
    </div>
  );
}

function WorkloadBars({ rows, t }: { rows: Awaited<ReturnType<typeof teamWorkload>>; t: AppDict }) {
  const max = Math.max(1, ...rows.map((r) => r.open));
  return (
    <ul className="divide-y divide-zinc-100">
      {rows.map((r) => (
        <li key={r.id} className="flex items-center gap-3 px-4 py-2.5">
          <Avatar name={r.name} />
          <div className="w-36 min-w-0 shrink-0">
            <Link href={`/tasks?assignee=${r.id}`} className="block truncate text-sm font-medium hover:text-indigo-600">
              {r.name}
            </Link>
            <div className="truncate text-xs text-zinc-400">{r.title}</div>
          </div>
          <div className="flex-1" title={t.dashboard.workloadTitle(r.name, r.open, r.overdue, r.inReview)}>
            <div className="h-2 rounded-e bg-zinc-100">
              <div className="h-2 rounded-e bg-indigo-500" style={{ width: `${(r.open / max) * 100}%` }} />
            </div>
          </div>
          <div className="w-28 shrink-0 text-end text-xs tabular-nums">
            <span className="font-medium text-zinc-900">{t.dashboard.openCount(r.open)}</span>
            {r.overdue > 0 && <span className="ms-1.5 font-medium text-red-600">{t.dashboard.lateCount(r.overdue)}</span>}
          </div>
        </li>
      ))}
    </ul>
  );
}

function SectionHeading({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mt-8 mb-3 flex items-center justify-between">
      <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
      {action}
    </div>
  );
}

function CardTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2">
      {icon}
      {children}
    </span>
  );
}

function SeeAll({ href, t }: { href: string; t: AppDict }) {
  return (
    <Link href={href} className="text-xs font-medium text-indigo-600 hover:text-indigo-500">
      {t.common.viewAll}
    </Link>
  );
}

const TIME_ZONE = "Asia/Riyadh";

function firstName(user: SessionUser) {
  return user.name.split(" ")[0];
}

/** Date line in the agency's time zone (the server runs on UTC). */
function today(lang: Lang) {
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: TIME_ZONE,
  }).format(new Date());
}

function greetingPart(): "morning" | "afternoon" | "evening" {
  const h = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: TIME_ZONE }).format(new Date()));
  return h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
}
