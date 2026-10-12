import Link from "next/link";
import { and, count, eq, gte, lt, lte, ne } from "drizzle-orm";
import { Download } from "lucide-react";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { getT } from "@/lib/lang";
import { period, timeEntriesIn } from "@/lib/reports";
import { formatMinutes } from "@/lib/time";
import { todayISO } from "@/server/queries";
import { Card, EmptyState, Field, Input, PageHeader, Stat, Table, Td, Th, buttonClass } from "@/components/ui";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t.reports.title };
}

/** Time and delivery for a period, with CSV downloads (admins). */
export default async function ReportsPage({ searchParams }: PageProps<"/reports">) {
  const user = await requirePermission("reports.view");
  const { t } = await getT();
  const r = t.reports;
  const sp = await searchParams;
  const p = period(sp.from, sp.to);

  const [entries, [{ n: completed }], [{ n: overdue }]] = await Promise.all([
    timeEntriesIn(user.orgId, p),
    db
      .select({ n: count() })
      .from(tasks)
      .where(
        and(
          eq(tasks.orgId, user.orgId),
          eq(tasks.status, "completed"),
          gte(tasks.completedAt, new Date(`${p.from}T00:00:00Z`)),
          lte(tasks.completedAt, new Date(`${p.to}T23:59:59Z`)),
        ),
      ),
    db
      .select({ n: count() })
      .from(tasks)
      .where(and(eq(tasks.orgId, user.orgId), ne(tasks.status, "completed"), lt(tasks.dueDate, todayISO()))),
  ]);
  const total = entries.reduce((n, e) => n + e.minutes, 0);
  const group = <K extends string>(key: (e: (typeof entries)[number]) => K, label: (e: (typeof entries)[number]) => string) => {
    const m = new Map<K, { label: string; minutes: number; entries: number; sub?: string }>();
    for (const e of entries) {
      const k = key(e);
      const row = m.get(k) ?? { label: label(e), minutes: 0, entries: 0, sub: e.client };
      row.minutes += e.minutes;
      row.entries += 1;
      m.set(k, row);
    }
    return [...m.values()].sort((a, b) => b.minutes - a.minutes);
  };
  const byProject = group((e) => e.projectId, (e) => e.project);
  const byPerson = group((e) => e.personId ?? "none", (e) => e.person ?? t.common.deletedUser);
  const qs = `from=${p.from}&to=${p.to}`;

  return (
    <>
      <PageHeader
        title={r.title}
        description={r.sub}
        actions={
          <>
            <a href={`/api/reports/time?${qs}`} className={buttonClass("secondary", "sm")} download>
              <Download className="size-4" /> {r.downloadTime}
            </a>
            <a href="/api/reports/tasks" className={buttonClass("secondary", "sm")} download>
              <Download className="size-4" /> {r.downloadTasks}
            </a>
          </>
        }
      />
      <form className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200/80 bg-white p-4">
        <Field label={r.from}>
          <Input type="date" name="from" defaultValue={p.from} />
        </Field>
        <Field label={r.to}>
          <Input type="date" name="to" defaultValue={p.to} />
        </Field>
        <button className={buttonClass("primary", "md")}>{r.apply}</button>
      </form>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label={r.totalTime} value={<span dir="ltr">{formatMinutes(total)}</span>} />
        <Stat label={r.completed} value={completed} tone="green" />
        <Stat label={r.overdue} value={overdue} tone={overdue ? "red" : "slate"} href="/tasks?view=overdue" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {(
          [
            [r.byProject, r.project, byProject],
            [r.byPerson, r.person, byPerson],
          ] as const
        ).map(([title, col, rows]) => (
          <Card key={title} title={title} padded={false}>
            {rows.length === 0 ? (
              <EmptyState>{r.none}</EmptyState>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>{col}</Th>
                    <Th className="text-end">{r.hours}</Th>
                    <Th className="text-end">{r.entries}</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.label}>
                      <Td>
                        <div className="font-medium">{row.label}</div>
                        {col === r.project && row.sub && <div className="text-xs text-zinc-500">{row.sub}</div>}
                      </Td>
                      <Td className="text-end tabular-nums">
                        <bdi dir="ltr">{formatMinutes(row.minutes)}</bdi>
                      </Td>
                      <Td className="text-end tabular-nums">{row.entries}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        ))}
      </div>
      <p className="mt-6 text-xs text-zinc-500">
        <Link href="/calendar" className="underline underline-offset-2">
          {t.calFeed.title}
        </Link>
      </p>
    </>
  );
}
