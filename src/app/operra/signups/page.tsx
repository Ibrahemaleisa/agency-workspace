import Link from "next/link";
import type { Metadata } from "next";
import { and, desc, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { signups } from "@/db/schema";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { ControlHeader } from "@/components/platform/control-header";
import { Ago, PeriodPicker, SIGNUP_STEPS, Stats, Table, Td, label, periodOf, stoppedAt } from "@/components/platform/control-ui";

export const metadata: Metadata = { title: "Sign-ups · Control center" };

type Counts = { visitors: number; signupVisitors: number; s1: number; s2: number; s3: number; s4: number; created: number };
type Row = { key: string | null; n: number };

export default async function ControlSignups({ searchParams }: PageProps<"/operra/signups">) {
  const admin = await requirePlatformAdmin();
  const days = periodOf((await searchParams).d);
  const since = sql`(now() - make_interval(days => ${days}))`;

  const [[counts], pages, sources, countries, daily, unfinished] = await Promise.all([
    db.execute<Counts>(sql`
      select
        (select count(distinct visitor_id)::int from platform_events where type = 'site_view' and created_at >= ${since}) as "visitors",
        (select count(distinct coalesce(visitor_id, id::text))::int from platform_events
           where type = 'signup_view' and meta->>'step' = '0' and created_at >= ${since}) as "signupVisitors",
        count(*)::int as "s1",
        count(*) filter (where step >= 2)::int as "s2",
        count(*) filter (where step >= 3)::int as "s3",
        count(*) filter (where step >= 4)::int as "s4",
        count(*) filter (where org_id is not null)::int as "created"
      from signups where created_at >= ${since}`),
    db.execute<Row>(sql`
      select path as key, count(*)::int as n from platform_events
      where type = 'site_view' and created_at >= ${since} group by path order by n desc limit 10`),
    db.execute<Row>(sql`
      select coalesce(meta->>'utm', meta->>'ref', 'Direct') as key, count(distinct visitor_id)::int as n from platform_events
      where type = 'site_view' and created_at >= ${since} group by 1 order by n desc limit 10`),
    db.execute<Row>(sql`
      select coalesce(country, '—') as key, count(distinct visitor_id)::int as n from platform_events
      where type = 'site_view' and created_at >= ${since} group by 1 order by n desc limit 10`),
    db.execute<{ day: string; visitors: number; started: number; created: number }>(sql`
      with d as (select generate_series(date_trunc('day', ${since}), date_trunc('day', now()), interval '1 day') as day)
      select to_char(d.day, 'DD Mon') as day,
        (select count(distinct visitor_id)::int from platform_events e where e.type = 'site_view' and date_trunc('day', e.created_at) = d.day) as visitors,
        (select count(*)::int from signups s where date_trunc('day', s.created_at) = d.day) as started,
        (select count(*)::int from signups s where s.org_id is not null and date_trunc('day', s.created_at) = d.day) as created
      from d order by d.day desc`),
    db
      .select({
        id: signups.id,
        name: signups.name,
        email: signups.email,
        company: signups.companyName,
        step: signups.step,
        lang: signups.lang,
        country: signups.country,
        createdAt: signups.createdAt,
        updatedAt: signups.updatedAt,
      })
      .from(signups)
      .where(and(isNull(signups.orgId), sql`${signups.createdAt} >= ${since}`))
      .orderBy(desc(signups.updatedAt))
      .limit(200),
  ]);
  const c = counts as unknown as Counts;
  const hasDaily = (daily as unknown as { visitors: number; started: number }[]).some((d) => d.visitors || d.started);
  const rows = (r: unknown) => r as Row[];

  // Funnel: each stage with its share of the first and the drop from the one before.
  const stages: [string, number][] = [
    ["Website visitors", c.visitors],
    ["Opened sign-up", c.signupVisitors],
    [`Step 1 · ${SIGNUP_STEPS[0]}`, c.s1],
    [`Step 2 · ${SIGNUP_STEPS[1]}`, c.s2],
    [`Step 3 · ${SIGNUP_STEPS[2]}`, c.s3],
    [`Step 4 · ${SIGNUP_STEPS[3]}`, c.s4],
    [SIGNUP_STEPS[4], c.created],
  ];
  const top = Math.max(...stages.map(([, n]) => n), 1);
  const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)}%` : "—");

  return (
    <>
      <ControlHeader name={admin.name} />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Sign-ups</h1>
          <PeriodPicker days={days} base="/operra/signups" />
        </div>

        <div className="mt-6">
          <Stats
            items={[
              ["Visitors", c.visitors],
              ["Opened sign-up", c.signupVisitors],
              ["Started", c.s1],
              ["Workspaces", c.created],
              ["Didn’t finish", c.s1 - c.created],
              ["Finished", pct(c.created, c.s1)],
            ]}
          />
        </div>

        <section aria-labelledby="funnel" className="mt-8">
          <h2 id="funnel" className={label}>Funnel · last {days} days</h2>
          <ol className="mt-3 space-y-2 rounded-lg border border-[#E3E4E0] bg-white p-4 text-sm" data-testid="funnel">
            {stages.map(([name, n], i) => {
              const prev = i > 0 ? stages[i - 1][1] : 0;
              return (
                <li key={name} className="grid grid-cols-[minmax(0,11rem)_1fr_auto] items-center gap-3 sm:grid-cols-[14rem_1fr_9rem]">
                  <span className="truncate">{name}</span>
                  <span className="h-5 rounded bg-[#F6F6F3]" aria-hidden>
                    <span className="block h-5 rounded bg-[#0B0D10]" style={{ width: `${(n / top) * 100}%`, minWidth: n ? 4 : 0 }} />
                  </span>
                  <span className="text-end font-mono">
                    {n}
                    {i > 0 && prev > 0 && n <= prev && (
                      <span className="ms-2 text-xs text-[#5A606B]" title="Share of the stage before">
                        {pct(n, prev)}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="mt-2 text-xs text-[#5A606B]">
            Visitors come from the marketing site; a visit and a sign-up line up when the visitor arrived through the site’s links.
          </p>
        </section>

        <section aria-labelledby="unfinished" className="mt-10">
          <h2 id="unfinished" className={label}>Didn’t finish · {unfinished.length}</h2>
          <div className="mt-3">
            <Table
              head={["Person", "Company", "Stopped at", "Started", "Last activity", "Country"]}
              empty={unfinished.length === 0 && "Everyone who started in this period finished."}
            >
              {unfinished.map((s) => (
                <tr key={s.id} className="hover:bg-[#F6F6F3]">
                  <Td>
                    <div className="font-medium">{s.name}</div>
                    <a href={`mailto:${s.email}`} className="text-xs text-[#5A606B] underline-offset-4 hover:underline" dir="ltr">
                      {s.email}
                    </a>
                  </Td>
                  <Td muted>{s.company ?? "—"}</Td>
                  <Td>{stoppedAt(s.step)}</Td>
                  <Td muted><Ago at={s.createdAt} /></Td>
                  <Td muted><Ago at={s.updatedAt} /></Td>
                  <Td muted mono>{s.country ?? "—"}</Td>
                </tr>
              ))}
            </Table>
          </div>
        </section>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {(
            [
              ["Top pages", rows(pages), "views"],
              ["Sources", rows(sources), "visitors"],
              ["Countries", rows(countries), "visitors"],
            ] as const
          ).map(([title, list, unit]) => (
            <section key={title}>
              <h2 className={label}>{title}</h2>
              <ul className="mt-3 divide-y divide-[#E3E4E0] rounded-lg border border-[#E3E4E0] bg-white text-sm">
                {list.map((r) => (
                  <li key={r.key ?? "—"} className="flex justify-between gap-3 px-4 py-2">
                    <span className="truncate font-mono text-xs" dir="ltr">{r.key ?? "—"}</span>
                    <span className="font-mono" title={unit}>{r.n}</span>
                  </li>
                ))}
                {list.length === 0 && <li className="px-4 py-3 text-[#5A606B]">No visits yet.</li>}
              </ul>
            </section>
          ))}
        </div>

        <section aria-labelledby="daily" className="mt-10">
          <h2 id="daily" className={label}>By day</h2>
          <div className="mt-3">
            <Table head={["Day", "Visitors", "Sign-ups started", "Workspaces created"]} minWidth={480} empty={!hasDaily && "No activity in this period."}>
              {(daily as unknown as { day: string; visitors: number; started: number; created: number }[])
                .filter((d) => d.visitors || d.started || d.created)
                .map((d) => (
                <tr key={d.day}>
                  <Td mono>{d.day}</Td>
                  <Td mono>{d.visitors}</Td>
                  <Td mono>{d.started}</Td>
                  <Td mono>{d.created}</Td>
                </tr>
              ))}
            </Table>
          </div>
        </section>

        <p className="mt-8 text-sm">
          <Link href="/operra/people" className="underline underline-offset-4">People →</Link>
        </p>
      </main>
    </>
  );
}
