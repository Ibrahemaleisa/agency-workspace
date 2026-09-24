import { desc, eq } from "drizzle-orm";
import { formatDistanceToNow } from "date-fns";
import { Building2, Mail, MessageSquareText, Phone, Sparkles } from "lucide-react";
import { db } from "@/db";
import { leads } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { updateLeadStatus } from "@/server/lead-actions";
import { AutoSubmitSelect } from "@/components/forms";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { getT } from "@/lib/lang";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t.leads.title };
}

const STATUS = [
  { value: "new", tone: "violet" },
  { value: "contacted", tone: "blue" },
  { value: "won", tone: "green" },
  { value: "lost", tone: "slate" },
] as const;

export default async function LeadsPage() {
  const user = await requirePermission("leads.manage");
  const { t, locale } = await getT();
  const rows = await db.select().from(leads).where(eq(leads.orgId, user.orgId)).orderBy(desc(leads.createdAt)).limit(200);
  const open = rows.filter((r) => r.status === "new").length;

  return (
    <>
      <PageHeader
        title={t.leads.title}
        description={`${t.leads.subtitle}${open ? ` · ${t.leads.newCount(open)}` : ""}`}
      />
      <Card padded={false}>
        {rows.length === 0 ? (
          <EmptyState icon={<Sparkles className="size-5" />}>
            {t.leads.empty}
          </EmptyState>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {rows.map((l) => {
              const s = STATUS.find((x) => x.value === l.status) ?? STATUS[0];
              return (
                <li key={l.id} className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-start md:px-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-zinc-900">{l.name}</span>
                      <Badge tone={s.tone} dot>
                        {t.leads.status[s.value]}
                      </Badge>
                      {l.service && <Badge>{l.service}</Badge>}
                      <span className="text-xs text-zinc-400">
                        {formatDistanceToNow(l.createdAt, { addSuffix: true, locale })} · {l.lang === "ar" ? t.leads.arabic : t.leads.english}
                      </span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-600">
                      {l.company && (
                        <span className="flex items-center gap-1.5">
                          <Building2 className="size-3.5 text-zinc-400" /> {l.company}
                        </span>
                      )}
                      {l.email && (
                        <a href={`mailto:${l.email}`} className="flex items-center gap-1.5 hover:text-indigo-600">
                          <Mail className="size-3.5 text-zinc-400" /> {l.email}
                        </a>
                      )}
                      {l.phone && (
                        <a href={`tel:${l.phone}`} className="flex items-center gap-1.5 hover:text-indigo-600" dir="ltr">
                          <Phone className="size-3.5 text-zinc-400" /> {l.phone}
                        </a>
                      )}
                    </div>
                    {l.message && (
                      <p className="mt-2 flex gap-1.5 text-sm whitespace-pre-wrap text-zinc-700" dir="auto">
                        <MessageSquareText className="mt-0.5 size-3.5 shrink-0 text-zinc-400" />
                        {l.message}
                      </p>
                    )}
                  </div>
                  <form action={updateLeadStatus} className="shrink-0">
                    <input type="hidden" name="leadId" value={l.id} />
                    <AutoSubmitSelect name="status" defaultValue={l.status} options={STATUS.map((x) => ({ value: x.value, label: t.leads.status[x.value] }))} className="w-36" aria-label={t.common.status} />
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
