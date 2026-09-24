import { requirePermission } from "@/lib/auth";
import { listActivity } from "@/server/queries";
import { ActivityFeed } from "@/components/lists";
import { Card, PageHeader } from "@/components/ui";
import { getT } from "@/lib/lang";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t.nav.activity };
}

export default async function ActivityPage() {
  const user = await requirePermission("activity.viewAll");
  const { t } = await getT();
  const items = await listActivity(user, { limit: 200 });
  return (
    <>
      <PageHeader title={t.activity.title} description={t.activity.subtitle} />
      <Card padded={false}>
        <ActivityFeed items={items} />
      </Card>
    </>
  );
}
