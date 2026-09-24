import { requirePermission } from "@/lib/auth";
import { createClient } from "@/server/admin-actions";
import { listInternalUsers } from "@/server/queries";
import { ClientForm } from "@/components/client-form";
import { Card, PageHeader } from "@/components/ui";
import { getT } from "@/lib/lang";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t.clients.newClient };
}

export default async function NewClientPage() {
  const user = await requirePermission("clients.manage");
  const { t } = await getT();
  const people = await listInternalUsers(user.orgId);
  return (
    <>
      <PageHeader title={t.clients.newClient} breadcrumb={[{ href: "/clients", label: t.clients.title }]} />
      <Card className="max-w-3xl">
        <ClientForm action={createClient} people={people} submitLabel={t.clientForm.create} />
      </Card>
    </>
  );
}
