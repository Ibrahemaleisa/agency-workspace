import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { clients, users } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { getT } from "@/lib/lang";
import { createUser, updateUser } from "@/server/admin-actions";
import { listClientsForOrg } from "@/server/queries";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Avatar, Badge, Card, Checkbox, Field, Input, PageHeader, Select, Table, Td, Th } from "@/components/ui";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t.team.title };
}


export default async function TeamPage() {
  const admin = await requirePermission("users.manage");
  const { t } = await getT();
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
            <div className="flex justify-end"><SubmitButton>{m.createUser}</SubmitButton></div>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
