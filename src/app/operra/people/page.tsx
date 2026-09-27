import Link from "next/link";
import type { Metadata } from "next";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { ControlHeader } from "@/components/platform/control-header";
import { Ago, Stats, Table, Td, label } from "@/components/platform/control-ui";
import { Badge } from "@/components/ui";

export const metadata: Metadata = { title: "People · Control center" };

type Person = {
  id: string;
  email: string;
  name: string | null;
  verified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  loginCount: number;
  lastSeenAt: string | null;
  agencies: { name: string; role: string; orgId: string }[] | null;
};

/** Everyone with an Operra account (the preview tenant's sample people excluded). */
export default async function ControlPeople({ searchParams }: PageProps<"/operra/people">) {
  const admin = await requirePlatformAdmin();
  const q = String((await searchParams).q ?? "").trim().slice(0, 80);
  const like = `%${q.replace(/[\\%_]/g, (c) => "\\" + c)}%`;

  const [people, [totals]] = await Promise.all([
    db.execute<Person>(sql`
      select a.id, a.email, a.email_verified_at is not null as verified, a.created_at as "createdAt",
             a.last_login_at as "lastLoginAt", a.login_count as "loginCount",
             max(u.name) as name, max(u.last_seen_at) as "lastSeenAt",
             json_agg(json_build_object('name', o.name, 'role', u.role, 'orgId', o.id) order by u.created_at) as agencies
      from accounts a
      join users u on u.account_id = a.id
      join organizations o on o.id = u.org_id and not o.is_demo
      ${q ? sql`where a.email ilike ${like} or u.name ilike ${like} or o.name ilike ${like}` : sql``}
      group by a.id
      order by greatest(a.last_login_at, max(u.last_seen_at), a.created_at) desc nulls last
      limit 300`),
    db.execute<{ people: number; active7: number; active30: number; never: number }>(sql`
      select count(distinct a.id)::int as people,
             count(distinct a.id) filter (where u.last_seen_at > now() - interval '7 days')::int as active7,
             count(distinct a.id) filter (where u.last_seen_at > now() - interval '30 days')::int as active30,
             count(distinct a.id) filter (where a.login_count = 0 and u.last_seen_at is null)::int as never
      from accounts a join users u on u.account_id = a.id join organizations o on o.id = u.org_id and not o.is_demo`),
  ]);
  const t = totals as unknown as { people: number; active7: number; active30: number; never: number };
  const list = people as unknown as Person[];

  return (
    <>
      <ControlHeader name={admin.name} />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">People</h1>
        <div className="mt-6">
          <Stats
            items={[
              ["People", t.people],
              ["Active 7 days", t.active7],
              ["Active 30 days", t.active30],
              ["Never came back", t.never],
            ]}
          />
        </div>
        <form className="mt-6 flex gap-2" role="search">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by email, name or agency"
            aria-label="Search people"
            className="block w-full max-w-md rounded-md border border-[#8C919A] bg-white px-3 py-2 text-sm"
          />
          <button className="rounded-md bg-[#0B0D10] px-3.5 py-2 text-sm font-medium text-white">Search</button>
        </form>
        <h2 className={`${label} mt-6`}>{list.length} {list.length === 1 ? "person" : "people"}</h2>
        <div className="mt-3">
          <Table
            head={["Person", "Agencies", "Email", "Joined", "Last sign-in", "Sign-ins", "Last seen"]}
            empty={list.length === 0 && (q ? `No one matches “${q}”.` : "No accounts yet.")}
            minWidth={900}
          >
            {list.map((p) => (
              <tr key={p.id} className="hover:bg-[#F6F6F3]">
                <Td>
                  <Link href={`/operra/people/${p.id}`} className="font-medium underline-offset-4 hover:underline">
                    {p.name ?? p.email}
                  </Link>
                  <div className="text-xs text-[#5A606B]" dir="ltr">{p.email}</div>
                </Td>
                <Td>
                  <ul className="space-y-0.5">
                    {(p.agencies ?? []).map((a) => (
                      <li key={a.orgId}>
                        <Link href={`/operra/customers/${a.orgId}`} className="underline-offset-4 hover:underline">{a.name}</Link>{" "}
                        <span className="text-xs text-[#5A606B]">{a.role}</span>
                      </li>
                    ))}
                  </ul>
                </Td>
                <Td>{p.verified ? <Badge tone="green">verified</Badge> : <Badge tone="slate">unverified</Badge>}</Td>
                <Td muted><Ago at={p.createdAt} /></Td>
                <Td muted><Ago at={p.lastLoginAt} /></Td>
                <Td mono>{p.loginCount}</Td>
                <Td muted><Ago at={p.lastSeenAt} /></Td>
              </tr>
            ))}
          </Table>
        </div>
      </main>
    </>
  );
}
