import { and, count, desc, eq } from "drizzle-orm";
import { formatDistanceToNow } from "date-fns";
import { Building2, Mail, MessageSquareText, Phone, Sparkles } from "lucide-react";
import { db } from "@/db";
import { leads } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { updateLeadStatus } from "@/server/lead-actions";
import { deleteLead } from "@/server/lifecycle-actions";
import { AutoSubmitSelect, ConfirmSubmit } from "@/components/forms";
import { Badge, Card, EmptyState, PageHeader, Pager, pageParam } from "@/components/ui";
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

const PAGE = 50;

export default async function LeadsPage({ searchParams }: PageProps<"/leads">) {
  const user = await requirePermission("leads.manage");
  const { t, locale } = await getT();
  const page = pageParam((await searchParams).page);
  const fetched = await db
    .select()
    .from(leads)
    .where(eq(leads.orgId, user.orgId))
    .orderBy(desc(leads.createdAt), desc(leads.id))
    .limit(PAGE + 1)
    .offset((page - 1) * PAGE);
  const rows = fetched.slice(0, PAGE);
  const [{ n: open }] = await db
    .select({ n: count() })
    .from(leads)
    .where(and(eq(leads.orgId, user.orgId), eq(leads.status, "new")));

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
                      <span className="text-xs text-zinc-500">
                        {formatDistanceToNow(l.createdAt, { addSuffix: true, locale })} · {l.lang === "ar" ? t.leads.arabic : t.leads.english}
                      </span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-600">
                      {l.company && (
                        <span className="flex items-center gap-1.5">
                          <Building2 className="size-3.5 text-zinc-500" /> {l.company}
                        </span>
                      )}
                      {l.email && (
                        <a href={`mailto:${l.email}`} className="flex items-center gap-1.5 hover:text-indigo-600">
                          <Mail className="size-3.5 text-zinc-500" /> {l.email}
                        </a>
                      )}
                      {l.phone && (
                        <a href={`tel:${l.phone}`} className="flex items-center gap-1.5 hover:text-indigo-600" dir="ltr">
                          <Phone className="size-3.5 text-zinc-500" /> {l.phone}
                        </a>
                      )}
                    </div>
                    {l.message && (
                      <p className="mt-2 flex gap-1.5 text-sm whitespace-pre-wrap text-zinc-700" dir="auto">
                        <MessageSquareText className="mt-0.5 size-3.5 shrink-0 text-zinc-500" />
                        {l.message}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <form action={updateLeadStatus}>
                      <input type="hidden" name="leadId" value={l.id} />
                      <AutoSubmitSelect name="status" defaultValue={l.status} options={STATUS.map((x) => ({ value: x.value, label: t.leads.status[x.value] }))} className="w-36" aria-label={t.common.status} />
                    </form>
                    <form action={deleteLead}>
                      <input type="hidden" name="leadId" value={l.id} />
                      <ConfirmSubmit message={t.lifecycle.deleteLeadConfirm}>{t.lifecycle.deleteLead}</ConfirmSubmit>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <Pager page={page} hasMore={fetched.length > PAGE} hrefFor={(p) => `/leads?page=${p}`} labels={t.paging} />
      </Card>
    </>
  );
}
