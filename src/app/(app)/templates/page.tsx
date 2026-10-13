import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { moduleTemplates, type ModuleTemplate } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { MODULE_TONES } from "@/lib/constants";
import { getT } from "@/lib/lang";
import { addLibraryTemplates, saveTemplate } from "@/server/admin-actions";
import { TEMPLATE_LIBRARY } from "@/lib/template-library";
import { getOrgById } from "@/lib/tenant";
import type { Lang } from "@/lib/i18n";
import { Check, Library } from "lucide-react";
import { ActionForm, ConfirmSubmit, SubmitButton } from "@/components/forms";
import { deleteTemplate } from "@/server/lifecycle-actions";
import { TemplateEditor } from "@/components/template-editor";
import { Badge, Card, Field, Input, PageHeader, buttonClass, cn, toneDot } from "@/components/ui";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t.nav.templates };
}

export default async function TemplatesPage({ searchParams }: PageProps<"/templates">) {
  const user = await requirePermission("templates.manage");
  const { t, lang: uiLang } = await getT();
  const dict = t;
  const sp = await searchParams;
  const org = await getOrgById(user.orgId);
  const libLang: Lang = sp.tl === "ar" || sp.tl === "en" ? sp.tl : (org?.defaultLang === "en" ? "en" : uiLang);
  const templates = await db
    .select()
    .from(moduleTemplates)
    .where(eq(moduleTemplates.orgId, user.orgId))
    .orderBy(asc(moduleTemplates.createdAt));

  return (
    <>
      <PageHeader
        title={t.templates.title}
        description={t.templates.subtitle}
        actions={
          <a href="#library" className={buttonClass("secondary", "sm")}>
            <Library aria-hidden className="size-4" /> {t.library.title}
          </a>
        }
      />
      <TemplateLibrary
        lang={libLang}
        uiLang={uiLang}
        added={typeof sp.added === "string" ? Number(sp.added) : null}
        have={templates.map((x) => ({ name: x.name, sourceKey: x.sourceKey }))}
      />
      <h2 className="mt-10 mb-4 text-lg font-semibold">{t.library.yours}</h2>
      <div className="grid gap-6 lg:grid-cols-2">
        {templates.map((t) => (
          <Card
            key={t.id}
            title={<Badge tone={t.color}>{t.name}</Badge>}
            actions={
              <form action={deleteTemplate}>
                <input type="hidden" name="templateId" value={t.id} />
                <ConfirmSubmit message={dict.lifecycle.deleteTemplateConfirm(t.name)}>{dict.lifecycle.deleteTemplate}</ConfirmSubmit>
              </form>
            }
          >
            <TemplateForm template={t} />
          </Card>
        ))}
        <Card title={t.templates.newTemplate}>
          <TemplateForm />
        </Card>
      </div>
    </>
  );
}

async function TemplateForm({ template }: { template?: ModuleTemplate }) {
  const { t } = await getT();
  const m = t.templates;
  return (
    <ActionForm action={saveTemplate} className="space-y-4" successMessage={m.saved}>
      {template && <input type="hidden" name="templateId" value={template.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={m.name}>
          <Input name="name" dir="auto" defaultValue={template?.name} required />
        </Field>
        <Field label={m.description}>
          <Input name="description" dir="auto" defaultValue={template?.description ?? ""} />
        </Field>
      </div>
      <TemplateEditor
        tones={MODULE_TONES}
        initial={{ color: template?.color ?? "slate", stages: template?.stages ?? [], fields: template?.fields ?? [] }}
        labels={{
          color: m.color,
          stages: m.stages,
          stagesHint: m.stagesHint,
          fields: m.fields,
          fieldsHint: m.fieldsHint,
          stagePlaceholder: m.stagePlaceholder,
          clientApproves: m.clientApproves,
          addStage: m.addStage,
          fieldLabel: m.fieldLabel,
          fieldType: m.fieldType,
          optionsPlaceholder: m.optionsPlaceholder,
          addField: m.addField,
          noFields: m.noFields,
          moveUp: m.moveUp,
          moveDown: m.moveDown,
          remove: m.remove,
          types: m.types,
          colors: m.colors,
        }}
      />
      <div className="flex justify-end border-t border-zinc-100 pt-4">
        <SubmitButton size="sm">{template ? m.save : m.create}</SubmitButton>
      </div>
    </ActionForm>
  );
}

/** The library of function templates (lib/template-library.ts), each added to the workspace in one click. */
async function TemplateLibrary({
  lang,
  uiLang,
  added,
  have,
}: {
  lang: Lang;
  uiLang: Lang;
  added: number | null;
  have: { name: string; sourceKey: string | null }[];
}) {
  const { t } = await getT();
  const l = t.library;
  const names = new Set(have.map((h) => h.name.trim().toLowerCase()));
  const keys = new Set(have.map((h) => h.sourceKey).filter(Boolean));
  const isAdded = (x: (typeof TEMPLATE_LIBRARY)[number]) =>
    keys.has(x.key) || names.has(x.name.en.toLowerCase()) || names.has(x.name.ar.toLowerCase());
  const missing = TEMPLATE_LIBRARY.filter((x) => !isAdded(x));
  return (
    <section id="library" className="scroll-mt-24 rounded-xl border border-zinc-200/80 bg-white p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)] md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <h2 className="text-base font-semibold">{l.title}</h2>
          <p className="mt-1 text-sm text-zinc-500">{l.sub}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-zinc-500">{l.language}</span>
          <div className="flex rounded-full border border-zinc-200 p-0.5 text-xs font-medium">
            {(["ar", "en"] as const).map((code) => (
              <a
                key={code}
                href={`/templates?tl=${code}#library`}
                aria-current={lang === code ? "true" : undefined}
                className={cn("rounded-full px-3 py-1", lang === code ? "bg-zinc-900 text-white" : "text-zinc-600 hover:text-zinc-900")}
              >
                {code === "ar" ? "العربية" : "English"}
              </a>
            ))}
          </div>
          {missing.length > 0 && (
            <form action={addLibraryTemplates}>
              <input type="hidden" name="lang" value={lang} />
              {missing.map((x) => (
                <input key={x.key} type="hidden" name="key" value={x.key} />
              ))}
              <button className={buttonClass("primary", "sm")}>{l.addAll(missing.length)}</button>
            </form>
          )}
        </div>
      </div>
      {added !== null && added > 0 && (
        <p role="status" className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {l.addedOk(added)}
        </p>
      )}
      <ul className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {TEMPLATE_LIBRARY.map((x) => {
          const done = isAdded(x);
          const approvals = x.stages.filter((st) => st.approval).length;
          return (
            <li key={x.key} className="flex flex-col rounded-lg border border-zinc-200 p-4" lang={lang} dir={lang === "ar" ? "rtl" : "ltr"}>
              <div className="flex items-start justify-between gap-2">
                <h3 className="flex items-center gap-2 font-medium">
                  <span aria-hidden className={cn("size-2.5 shrink-0 rounded-full", (toneDot as Record<string, string>)[x.color] ?? "bg-zinc-400")} />
                  {x.name[lang]}
                </h3>
                {done ? (
                  <Badge tone="green">
                    <Check className="size-3" /> {l.added}
                  </Badge>
                ) : (
                  <form action={addLibraryTemplates} dir={uiLang === "ar" ? "rtl" : "ltr"}>
                    <input type="hidden" name="lang" value={lang} />
                    <input type="hidden" name="key" value={x.key} />
                    <button className={buttonClass("secondary", "sm")}>{l.add}</button>
                  </form>
                )}
              </div>
              <p className="mt-1 text-sm text-zinc-500">{x.description[lang]}</p>
              <ol className="mt-3 flex flex-wrap gap-1.5">
                {x.stages.map((st, i) => (
                  <li
                    key={st.en}
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] ring-1 ring-inset",
                      st.approval ? "bg-amber-50 text-amber-800 ring-amber-200" : "bg-zinc-50 text-zinc-600 ring-zinc-200",
                    )}
                  >
                    {i + 1}. {st[lang]}
                    {st.approval && " ✓"}
                  </li>
                ))}
              </ol>
              <p className="mt-auto pt-3 text-xs text-zinc-500">
                {l.stages(x.stages.length)} · {l.approvals(approvals)}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
