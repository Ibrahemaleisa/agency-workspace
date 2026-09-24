import { requireUser } from "@/lib/auth";
import { listTasks } from "@/server/queries";
import { TaskTable } from "@/components/lists";
import { Card, PageHeader } from "@/components/ui";
import { getT } from "@/lib/lang";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t.approvals.title };
}

export default async function ApprovalsPage() {
  const user = await requireUser();
  const isClient = user.role === "client";
  const { t } = await getT();
  const [pending, decided] = await Promise.all([
    listTasks(user, { approvalPending: true }),
    listTasks(user, { approvalDecided: true, orderBy: "updated", limit: 20 }),
  ]);
  return (
    <>
      <PageHeader
        title={t.approvals.title}
        description={isClient ? t.approvals.subtitleClient : t.approvals.subtitleStaff}
      />
      <div className="min-w-0 space-y-6">
        <Card title={t.approvals.awaiting(pending.length)} padded={false}>
          <TaskTable tasks={pending} showProject empty={t.approvals.none} />
        </Card>
        <Card title={t.approvals.recent} padded={false}>
          <TaskTable tasks={decided} empty={t.approvals.noDecisions} />
        </Card>
      </div>
    </>
  );
}
