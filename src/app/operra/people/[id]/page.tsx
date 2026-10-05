import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { accounts, organizations, signups, users } from "@/db/schema";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { isUuid } from "@/lib/access";
import { ControlHeader } from "@/components/platform/control-header";
import { Ago, EVENT_LABEL, Table, Td, label, stoppedAt } from "@/components/platform/control-ui";
import { Badge } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/forms";
import { resetLinkAction } from "@/server/platform-admin-actions";

export const metadata: Metadata = { title: "Person · Control center" };

type Ev = { id: string; type: string; path: string | null; country: string | null; meta: Record<string, string | number> | null; createdAt: Date; org: string | null };

export default async function ControlPerson({ params }: PageProps<"/operra/people/[id]">) {
  const admin = await requirePlatformAdmin();
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const account = await db.query.accounts.findFirst({ where: eq(accounts.id, id) });
  if (!account) notFound();

  const [memberships, theirSignups, events] = await Promise.all([
    db
      .select({ id: users.id, name: users.name, role: users.role, active: users.active, lastSeenAt: users.lastSeenAt, createdAt: users.createdAt, orgId: organizations.id, org: organizations.name, serial: organizations.serial })
      .from(users)
      .innerJoin(organizations, and(eq(organizations.id, users.orgId), eq(organizations.isDemo, false)))
      .where(eq(users.accountId, id))
      .orderBy(desc(users.createdAt)),
    db.query.signups.findMany({ where: eq(signups.email, account.email), orderBy: desc(signups.createdAt), limit: 20 }),
    // Everything tied to the account, plus the anonymous visits of the browsers they signed up from.
    db.execute<Ev>(sql`
      select e.id, e.type, e.path, e.country, e.meta, e.created_at as "createdAt", o.name as org
      from platform_events e left join organizations o on o.id = e.org_id
      where e.account_id = ${id}
         or e.signup_id in (select s.id from signups s where s.email = ${account.email})
         or e.visitor_id in (
              select s.visitor_id from signups s where s.email = ${account.email} and s.visitor_id is not null
              union select e2.visitor_id from platform_events e2 where e2.account_id = ${id} and e2.visitor_id is not null)
      order by e.created_at desc limit 300`),
  ]);
  const name = memberships[0]?.name ?? theirSignups[0]?.name ?? account.email;
  const timeline = events as unknown as Ev[];
  const row = "flex justify-between gap-4 border-b border-[#E1E2DE] py-2.5 last:border-0";
  const fmt = (d: Date | null | undefined) => (d ? format(d, "d MMM yyyy, HH:mm") : "—");

  const detail = (e: Ev) => {
    const m = e.meta ?? {};
    if (e.type === "signup_view") return Number(m.step) >= 4 ? "Workspace setup" : `Step ${Number(m.step) + 1}`;
    if (e.type === "signup_step") return `Step ${m.step}${m.mode ? ` · ${m.mode}` : ""}`;
    if (e.type === "site_view") return [e.path, m.ref && `from ${m.ref}`, m.utm && `utm ${m.utm}`].filter(Boolean).join(" · ");
    if (e.type === "login_failed") return m.reason === "password" ? "Wrong password" : String(m.reason ?? "");
    if (e.type === "workspace_created") return String(m.serial ?? "");
    return e.org ?? "";
  };

  return (
    <>
      <ControlHeader name={admin.name} />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Link href="/operra/people" className="text-sm text-[#5B606B] underline-offset-4 hover:underline">← People</Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
          {account.emailVerifiedAt ? <Badge tone="green">verified</Badge> : <Badge tone="slate">unverified</Badge>}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <section className="rounded-lg border border-[#E1E2DE] bg-white p-5 text-sm">
            <h2 className={label}>Account</h2>
            <dl className="mt-3">
              <div className={row}><dt className="text-[#5B606B]">Email</dt><dd dir="ltr"><a href={`mailto:${account.email}`} className="underline-offset-4 hover:underline">{account.email}</a></dd></div>
              <div className={row}><dt className="text-[#5B606B]">Joined</dt><dd>{fmt(account.createdAt)}</dd></div>
              <div className={row}><dt className="text-[#5B606B]">Last sign-in</dt><dd>{fmt(account.lastLoginAt)}</dd></div>
              <div className={row}><dt className="text-[#5B606B]">Sign-ins</dt><dd className="font-mono">{account.loginCount}</dd></div>
            </dl>
            <ActionForm action={resetLinkAction} className="mt-4" linkLabels={{ note: "Give this link to the person yourself (valid 24 hours, works once):", copy: "Copy link", copied: "Copied" }}>
              <input type="hidden" name="accountId" value={account.id} />
              <SubmitButton size="sm" variant="secondary">Create password reset link</SubmitButton>
            </ActionForm>
          </section>
          <section className="rounded-lg border border-[#E1E2DE] bg-white p-5 text-sm lg:col-span-2">
            <h2 className={label}>Agencies</h2>
            <ul className="mt-3 divide-y divide-[#E1E2DE]">
              {memberships.map((m) => (
                <li key={m.id} className="flex flex-wrap items-baseline justify-between gap-3 py-2.5">
                  <span>
                    <Link href={`/operra/customers/${m.orgId}`} className="font-medium underline-offset-4 hover:underline">{m.org}</Link>{" "}
                    <span className="font-mono text-xs text-[#5B606B]">{m.serial}</span>
                  </span>
                  <span className="text-[#5B606B]">
                    {m.role}{!m.active && " · deactivated"} · last seen <Ago at={m.lastSeenAt} />
                  </span>
                </li>
              ))}
              {memberships.length === 0 && <li className="py-2.5 text-[#5B606B]">No agency yet.</li>}
            </ul>
            {theirSignups.length > 0 && (
              <>
                <h2 className={`${label} mt-5`}>Sign-ups</h2>
                <ul className="mt-2 divide-y divide-[#E1E2DE]">
                  {theirSignups.map((s) => (
                    <li key={s.id} className="flex flex-wrap justify-between gap-3 py-2">
                      <span>{s.companyName ?? "—"}</span>
                      <span className="text-[#5B606B]">
                        {s.orgId ? "Finished" : `Stopped at ${stoppedAt(s.step)}`} · <Ago at={s.createdAt} />
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </div>

        <section aria-labelledby="timeline" className="mt-10">
          <h2 id="timeline" className={label}>Activity · latest {timeline.length}</h2>
          <div className="mt-3">
            <Table head={["When", "What", "Detail", "Country"]} empty={timeline.length === 0 && "No activity recorded yet."} minWidth={640}>
              {timeline.map((e) => (
                <tr key={e.id}>
                  <Td muted><span title={fmt(new Date(e.createdAt))}>{fmt(new Date(e.createdAt))}</span></Td>
                  <Td>{EVENT_LABEL[e.type] ?? e.type}</Td>
                  <Td muted><span dir="auto">{detail(e)}</span></Td>
                  <Td mono muted>{e.country ?? "—"}</Td>
                </tr>
              ))}
            </Table>
          </div>
        </section>
      </main>
    </>
  );
}
