import Link from "next/link";
import { DEFAULT_TRIAL_DAYS } from "@/lib/billing/defaults";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { organizations, provisionings, subscriptions, users } from "@/db/schema";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { isUuid } from "@/lib/access";
import { tenantEntryUrl } from "@/lib/platform";
import { extendTrial, setTenantStatus } from "@/server/platform-admin-actions";
import { ControlHeader } from "@/components/platform/control-header";
import { Badge } from "@/components/ui";
import { ConfirmSubmit } from "@/components/forms";

export default async function ControlCustomer({ params }: PageProps<"/operra/customers/[id]">) {
  const admin = await requirePlatformAdmin();
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const org = await db.query.organizations.findFirst({ where: eq(organizations.id, id) });
  if (!org) notFound();
  const [sub, prov, people, [counts]] = await Promise.all([
    db.query.subscriptions.findFirst({ where: eq(subscriptions.orgId, id) }),
    db.query.provisionings.findFirst({ where: eq(provisionings.orgId, id) }),
    db
      .select({ name: users.name, email: users.email, role: users.role, active: users.active, createdAt: users.createdAt })
      .from(users)
      .where(eq(users.orgId, id))
      .orderBy(asc(users.role), asc(users.createdAt))
      .limit(100),
    db.execute<{ projects: number; tasks: number; clients: number }>(sql`
      select (select count(*)::int from projects where org_id = ${id}) as projects,
             (select count(*)::int from tasks where org_id = ${id}) as tasks,
             (select count(*)::int from clients where org_id = ${id}) as clients`),
  ]);
  const c = counts as unknown as { projects: number; tasks: number; clients: number };
  const fmt = (d: Date | null | undefined) => (d ? format(d, "d MMM yyyy, HH:mm") : "—");
  const row = "flex justify-between gap-4 border-b border-[#E3E4E0] py-2.5 last:border-0";

  return (
    <>
      <ControlHeader name={admin.name} />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Link href="/operra" className="text-sm text-[#5A606B] underline-offset-4 hover:underline">
          ← Customers
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{org.name}</h1>
          <span className="font-mono text-sm">{org.serial}</span>
          <Badge tone={org.status === "active" ? "green" : "amber"}>{org.status}</Badge>
          {org.isDemo && <Badge tone="violet">Preview tenant</Badge>}
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <section className="rounded-lg border border-[#E3E4E0] bg-white p-5 text-sm">
            <h2 className="font-mono text-[11px] tracking-[0.08em] text-[#5A606B] uppercase">Instance</h2>
            <dl className="mt-3">
              <div className={row}><dt className="text-[#5A606B]">Instance ID</dt><dd className="font-mono">{org.serial}</dd></div>
              <div className={row}><dt className="text-[#5A606B]">Tenant ID</dt><dd className="font-mono text-xs">{org.id}</dd></div>
              <div className={row}><dt className="text-[#5A606B]">Address</dt><dd className="font-mono text-xs">{tenantEntryUrl(org).replace(/^https?:\/\//, "")}</dd></div>
              <div className={row}><dt className="text-[#5A606B]">Custom domain</dt><dd>{org.customDomain ?? "—"}</dd></div>
              <div className={row}><dt className="text-[#5A606B]">Created</dt><dd>{fmt(org.createdAt)}</dd></div>
              <div className={row}><dt className="text-[#5A606B]">Onboarded</dt><dd>{fmt(org.onboardedAt)}</dd></div>
              <div className={row}><dt className="text-[#5A606B]">Provisioning</dt><dd>{prov ? `${prov.status} · ${prov.attempts} attempt(s)` : "— (created before sign-up)"}</dd></div>
              {prov?.error && <div className={row}><dt className="text-[#5A606B]">Last error</dt><dd className="text-red-700">{prov.error}</dd></div>}
            </dl>
          </section>
          <section className="rounded-lg border border-[#E3E4E0] bg-white p-5 text-sm">
            <h2 className="font-mono text-[11px] tracking-[0.08em] text-[#5A606B] uppercase">Subscription</h2>
            {sub ? (
              <dl className="mt-3">
                <div className={row}><dt className="text-[#5A606B]">Plan</dt><dd>{sub.planCode}</dd></div>
                <div className={row}><dt className="text-[#5A606B]">Status</dt><dd>{sub.status}</dd></div>
                <div className={row}><dt className="text-[#5A606B]">Trial ends</dt><dd>{fmt(sub.trialEndsAt)}</dd></div>
                <div className={row}><dt className="text-[#5A606B]">Period ends</dt><dd>{fmt(sub.currentPeriodEnd)}</dd></div>
                <div className={row}><dt className="text-[#5A606B]">Provider</dt><dd>{sub.provider}</dd></div>
                <div className={row}><dt className="text-[#5A606B]">Customer</dt><dd className="font-mono text-xs">{sub.providerCustomerId ?? "—"}</dd></div>
              </dl>
            ) : (
              <p className="mt-3 text-[#5A606B]">No subscription (single-agency or legacy tenant).</p>
            )}
            {sub && sub.status !== "active" && !org.isDemo && (
              <form action={extendTrial} className="mt-4 flex items-center gap-2">
                <input type="hidden" name="orgId" value={org.id} />
                <label className="sr-only" htmlFor="days">Days</label>
                <input id="days" name="days" type="number" min={1} max={90} defaultValue={DEFAULT_TRIAL_DAYS} className="w-20 rounded-md border border-[#8C919A] px-2 py-1.5" />
                <button className="rounded-md border border-[#8C919A] px-3 py-1.5 font-medium">Extend trial</button>
              </form>
            )}
          </section>
          <section className="rounded-lg border border-[#E3E4E0] bg-white p-5 text-sm">
            <h2 className="font-mono text-[11px] tracking-[0.08em] text-[#5A606B] uppercase">Branding & usage</h2>
            <div className="mt-3 flex items-center gap-3">
              {org.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={org.logo} alt="" className="size-10 rounded object-contain" style={{ background: org.primaryColor }} />
              ) : (
                <span className="flex size-10 items-center justify-center rounded font-semibold" style={{ background: org.primaryColor, color: org.accentColor }}>
                  {org.name[0]}
                </span>
              )}
              <div className="font-mono text-xs">
                {org.primaryColor} · {org.accentColor}
                <div className="text-[#5A606B]">default {org.defaultLang}</div>
              </div>
            </div>
            <dl className="mt-3">
              <div className={row}><dt className="text-[#5A606B]">Users</dt><dd className="font-mono">{people.length}</dd></div>
              <div className={row}><dt className="text-[#5A606B]">Clients</dt><dd className="font-mono">{c.clients}</dd></div>
              <div className={row}><dt className="text-[#5A606B]">Projects</dt><dd className="font-mono">{c.projects}</dd></div>
              <div className={row}><dt className="text-[#5A606B]">Tasks</dt><dd className="font-mono">{c.tasks}</dd></div>
            </dl>
            {!org.isDemo && (
              <form action={setTenantStatus} className="mt-4">
                <input type="hidden" name="orgId" value={org.id} />
                <input type="hidden" name="status" value={org.status === "suspended" ? "active" : "suspended"} />
                <ConfirmSubmit
                  message={org.status === "suspended" ? "Restore access to this workspace?" : "Pause this workspace? Its users are signed out immediately."}
                  variant={org.status === "suspended" ? "secondary" : "danger"}
                  size="md"
                >
                  {org.status === "suspended" ? "Restore workspace" : "Pause workspace"}
                </ConfirmSubmit>
              </form>
            )}
          </section>
        </div>
        <section className="mt-6 overflow-x-auto rounded-lg border border-[#E3E4E0] bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <caption className="px-4 pt-4 text-start font-mono text-[11px] tracking-[0.08em] text-[#5A606B] uppercase">Users</caption>
            <tbody className="divide-y divide-[#E3E4E0]">
              {people.map((u) => (
                <tr key={u.email}>
                  <td className="px-4 py-2.5 font-medium">{u.name}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{u.email}</td>
                  <td className="px-4 py-2.5">{u.role}</td>
                  <td className="px-4 py-2.5">{u.active ? "active" : "deactivated"}</td>
                  <td className="px-4 py-2.5 text-[#5A606B]">{format(u.createdAt, "d MMM yyyy")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </>
  );
}
