import { and, asc, eq, gt, isNull } from "drizzle-orm";
import { format } from "date-fns";
import { db } from "@/db";
import { clients, invitations, users } from "@/db/schema";
import { getSaasT } from "@/lib/i18n-saas";
import { createInvitation, revokeInvitation } from "@/server/invite-actions";
import { requirePermission } from "@/lib/auth";
import { getT } from "@/lib/lang";
import { createUser, updateUser } from "@/server/admin-actions";
import { listClientsForOrg } from "@/server/queries";
import { ActionForm, ConfirmSubmit, SubmitButton } from "@/components/forms";
import { Avatar, Badge, Card, Checkbox, Field, Input, PageHeader, Select, Table, Td, Th } from "@/components/ui";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t.team.title };
}


export default async function TeamPage() {
  const admin = await requirePermission("users.manage");
  const { t, locale } = await getT();
  const { t: st } = await getSaasT();
  const iv = st.invite;
  const m = t.team;
  const roleOptions = (["admin", "employee", "client"] as const).map((value) => ({ value, label: t.roles[value] }));
  const [people, clientOptions] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        title: users.title,
        active: users.active,
        clientId: users.clientId,
        clientName: clients.name,
      })
      .from(users)
      .leftJoin(clients, eq(clients.id, users.clientId))
      .where(eq(users.orgId, admin.orgId))
      .orderBy(asc(users.role), asc(users.name)),
    listClientsForOrg(admin.orgId),
  ]);
  const pending = await db
    .select({ id: invitations.id, email: invitations.email, role: invitations.role, expiresAt: invitations.expiresAt })
    .from(invitations)
    .where(
      and(
        eq(invitations.orgId, admin.orgId),
        isNull(invitations.acceptedAt),
        isNull(invitations.revokedAt),
        gt(invitations.expiresAt, new Date()),
      ),
    )
    .orderBy(asc(invitations.createdAt));
  const focusOptions = [
    { value: "account", label: st.focus.account },
    { value: "production", label: st.focus.production },
  ];
  const clientSelect = clientOptions.map((c) => ({ value: c.id, label: c.name }));

  return (
    <>
      <PageHeader title={m.title} description={m.subtitle} />
      <div className="grid gap-6 xl:grid-cols-3">
        <Card title={m.users(people.length)} padded={false} className="xl:col-span-2">
          <Table>
            <thead>
              <tr>
                <Th>{m.name}</Th>
                <Th>{m.role}</Th>
                <Th>{m.status}</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {people.map((p) => (
                <tr key={p.id} className="align-top">
                  <Td>
                    <div className="flex items-center gap-2">
                      <Avatar name={p.name} size="md" />
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-zinc-500">{p.email}</div>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <Badge tone={p.role === "admin" ? "violet" : p.role === "client" ? "amber" : "blue"}>{t.roles[p.role]}</Badge>
                    <div className="mt-1 text-xs text-zinc-500">{p.role === "client" ? p.clientName : p.title}</div>
                  </Td>
                  <Td>{p.active ? <Badge tone="green">{t.common.active}</Badge> : <Badge>{m.deactivated}</Badge>}</Td>
                  <Td className="w-24 text-end">
                    <details className="group relative">
                      <summary className="cursor-pointer list-none text-xs font-medium text-indigo-600">{m.edit}</summary>
                      <div className="absolute end-0 z-10 mt-2 w-80 rounded-xl border border-zinc-200/80 bg-white p-4 text-start shadow-lg">
                        <ActionForm action={updateUser} className="space-y-3" successMessage={t.common.saved}>
                          <input type="hidden" name="userId" value={p.id} />
                          <Field label={m.name}><Input name="name" defaultValue={p.name} required /></Field>
                          <Field label={m.email}><Input name="email" type="email" defaultValue={p.email} required dir="ltr" /></Field>
                          <Field label={m.jobTitle}><Input name="title" defaultValue={p.title ?? ""} /></Field>
                          <Field label={m.role}><Select name="role" defaultValue={p.role} options={roleOptions} /></Field>
                          <Field label={m.clientForUsers}>
                            <Select name="clientId" defaultValue={p.clientId ?? ""} placeholder="—" options={clientSelect} />
                          </Field>
                          <Field label={m.newPassword} hint={m.newPasswordHint}>
                            <Input name="password" type="password" minLength={8} autoComplete="new-password" />
                          </Field>
                          <Checkbox name="active" defaultChecked={p.active} label={m.activeLabel} />
                          <div className="flex justify-end"><SubmitButton size="sm">{t.common.save}</SubmitButton></div>
                        </ActionForm>
                      </div>
                    </details>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>

        <div className="space-y-6">
        <div data-tour="invite-card">
        <Card title={iv.title}>
          <p className="-mt-1 mb-4 text-sm text-zinc-500">{iv.sub}</p>
          <ActionForm
            action={createInvitation}
            className="space-y-3"
            resetOnSuccess
            successMessage={iv.sent}
            linkLabels={{ note: iv.linkNote, copy: iv.copy, copied: iv.copied }}
          >
            <Field label={iv.email}><Input name="email" type="email" required dir="ltr" /></Field>
            <Field label={iv.role}><Select name="role" defaultValue="employee" options={roleOptions} /></Field>
            <Field label={st.focus.label} hint={st.focus.hint}>
              <Select name="focus" defaultValue="account" options={focusOptions} />
            </Field>
            <Field label={iv.jobTitle}><Input name="title" placeholder={m.titlePlaceholder} /></Field>
            <Field label={iv.client} hint={iv.clientHint}>
              <Select name="clientId" placeholder="—" options={clientSelect} />
            </Field>
            <div className="flex justify-end"><SubmitButton>{iv.submit}</SubmitButton></div>
          </ActionForm>
          <div className="mt-6 border-t border-zinc-100 pt-4">
            <h3 className="text-sm font-semibold text-zinc-900">{iv.pending}</h3>
            {pending.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-500">{iv.none}</p>
            ) : (
              <ul className="mt-2 divide-y divide-zinc-100">
                {pending.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <div className="min-w-0">
                      <div className="truncate font-medium" dir="ltr">{p.email}</div>
                      <div className="text-xs text-zinc-500">
                        {t.roles[p.role]} · {iv.expires(format(p.expiresAt, "d MMM", { locale }))}
                      </div>
                    </div>
                    <form action={revokeInvitation}>
                      <input type="hidden" name="id" value={p.id} />
                      <ConfirmSubmit message={iv.revokeConfirm} variant="secondary">{iv.revoke}</ConfirmSubmit>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
        </div>

        <Card title={m.addUser}>
          <ActionForm action={createUser} className="space-y-3" resetOnSuccess successMessage={m.userCreated}>
            <Field label={m.fullName}><Input name="name" required /></Field>
            <Field label={m.email}><Input name="email" type="email" required dir="ltr" /></Field>
            <Field label={m.jobTitle}><Input name="title" placeholder={m.titlePlaceholder} /></Field>
            <Field label={m.role}><Select name="role" defaultValue="employee" options={roleOptions} /></Field>
            <Field label={m.client} hint={m.clientHint}>
              <Select name="clientId" placeholder="—" options={clientSelect} />
            </Field>
            <Field label={m.tempPassword} hint={m.tempPasswordHint}>
              <Input name="password" type="password" required minLength={8} autoComplete="new-password" />
            </Field>
            <Field label={st.focus.label} hint={st.focus.hint}>
              <Select name="focus" defaultValue="account" options={focusOptions} />
            </Field>
            <div className="flex justify-end"><SubmitButton>{m.createUser}</SubmitButton></div>
          </ActionForm>
        </Card>
        </div>
      </div>
    </>
  );
}
