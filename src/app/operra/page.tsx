import Link from "next/link";
import { format } from "date-fns";
import { desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { organizations, provisionings, subscriptions, users } from "@/db/schema";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { ControlHeader } from "@/components/platform/control-header";
import { Badge } from "@/components/ui";

const STATUS_TONE = { active: "green", provisioning: "blue", suspended: "amber", cancelled: "red" } as const;
const SUB_TONE: Record<string, "green" | "blue" | "amber" | "red" | "slate"> = {
  active: "green",
  trialing: "blue",
  past_due: "amber",
  incomplete: "amber",
  unpaid: "red",
  canceled: "red",
};

export default async function ControlCustomers({ searchParams }: PageProps<"/operra">) {
  const admin = await requirePlatformAdmin();
  const q = String((await searchParams).q ?? "").trim().slice(0, 80);
  const like = `%${q.replace(/[\\%_]/g, (c) => "\\" + c)}%`;
  const userCount = db
    .select({ orgId: users.orgId, n: sql<number>`count(*)::int`.as("n") })
    .from(users)
    .groupBy(users.orgId)
    .as("uc");

  const rows = await db
    .select({
      id: organizations.id,
      serial: organizations.serial,
      name: organizations.name,
      slug: organizations.slug,
      status: organizations.status,
      isDemo: organizations.isDemo,
      primary: organizations.primaryColor,
      accent: organizations.accentColor,
      createdAt: organizations.createdAt,
      subStatus: subscriptions.status,
      trialEndsAt: subscriptions.trialEndsAt,
      provisioning: provisionings.status,
      users: sql<number>`coalesce(${userCount.n}, 0)`.mapWith(Number),
    })
    .from(organizations)
    .leftJoin(subscriptions, eq(subscriptions.orgId, organizations.id))
    .leftJoin(provisionings, eq(provisionings.orgId, organizations.id))
    .leftJoin(userCount, eq(userCount.orgId, organizations.id))
    .where(q ? or(ilike(organizations.serial, like), ilike(organizations.name, like), ilike(organizations.slug, like)) : undefined)
    .orderBy(desc(organizations.createdAt))
    .limit(200);

  const [totals] = await db
    .select({
      tenants: sql<number>`count(*) filter (where not ${organizations.isDemo})::int`,
      active: sql<number>`count(*) filter (where ${organizations.status} = 'active' and not ${organizations.isDemo})::int`,
    })
    .from(organizations);
  const [subs] = await db
    .select({
      trialing: sql<number>`count(*) filter (where ${subscriptions.status} = 'trialing')::int`,
      paying: sql<number>`count(*) filter (where ${subscriptions.status} = 'active')::int`,
    })
    .from(subscriptions);

  const stats = [
    ["Customers", totals.tenants],
    ["Active", totals.active],
    ["On trial", subs.trialing],
    ["Paying", subs.paying],
  ] as const;

  return (
    <>
      <ControlHeader name={admin.name} />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
        <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[#E3E4E0] bg-[#E3E4E0] sm:grid-cols-4">
          {stats.map(([label, n]) => (
            <div key={label} className="bg-white p-4">
              <dt className="font-mono text-[11px] tracking-[0.08em] text-[#5A606B] uppercase">{label}</dt>
              <dd className="mt-1 font-mono text-2xl">{n}</dd>
            </div>
          ))}
        </dl>
        <form className="mt-6 flex gap-2" role="search">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by instance ID, company or address — e.g. OPR-000042"
            aria-label="Search customers"
            className="block w-full max-w-md rounded-md border border-[#8C919A] bg-white px-3 py-2 text-sm"
          />
          <button className="rounded-md bg-[#0B0D10] px-3.5 py-2 text-sm font-medium text-white">Search</button>
        </form>
        <div className="mt-4 overflow-x-auto rounded-lg border border-[#E3E4E0] bg-white">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b border-[#E3E4E0] text-start font-mono text-[11px] tracking-[0.08em] text-[#5A606B] uppercase">
              <tr>
                {["Instance", "Company", "Tenant", "Subscription", "Provisioning", "Users", "Created"].map((h) => (
                  <th key={h} scope="col" className="px-4 py-2.5 text-start font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3E4E0]">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-[#F6F6F3]">
                  <td className="px-4 py-3 font-mono">
                    <Link href={`/operra/customers/${r.id}`} className="underline-offset-4 hover:underline">
                      {r.serial}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex overflow-hidden rounded border border-zinc-200" aria-hidden>
                        <span className="size-3" style={{ background: r.primary }} />
                        <span className="size-3" style={{ background: r.accent }} />
                      </span>
                      <span className="font-medium">{r.name}</span>
                      {r.isDemo && <Badge tone="violet">Preview</Badge>}
                    </div>
                    <div className="font-mono text-xs text-[#5A606B]">{r.slug}</div>
                  </td>
                  <td className="px-4 py-3"><Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge></td>
                  <td className="px-4 py-3">
                    {r.subStatus ? <Badge tone={SUB_TONE[r.subStatus] ?? "slate"}>{r.subStatus}</Badge> : <span className="text-[#5A606B]">—</span>}
                    {r.subStatus === "trialing" && r.trialEndsAt && (
                      <div className="mt-0.5 text-xs text-[#5A606B]">until {format(r.trialEndsAt, "d MMM")}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#5A606B]">{r.provisioning ?? "—"}</td>
                  <td className="px-4 py-3 font-mono">{r.users}</td>
                  <td className="px-4 py-3 text-[#5A606B]">{format(r.createdAt, "d MMM yyyy")}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[#5A606B]">No customers match “{q}”.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
