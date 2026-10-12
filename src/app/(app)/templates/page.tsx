import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { moduleTemplates, type ModuleTemplate } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { MODULE_TONES } from "@/lib/constants";
import { getT } from "@/lib/lang";
import { saveTemplate } from "@/server/admin-actions";
import { ActionForm, SubmitButton } from "@/components/forms";
import { TemplateEditor } from "@/components/template-editor";
import { Badge, Card, Field, Input, PageHeader } from "@/components/ui";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t.nav.templates };
}

export default async function TemplatesPage() {
  const user = await requirePermission("templates.manage");
  const { t } = await getT();
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
      />
      <div className="grid gap-6 lg:grid-cols-2">
        {templates.map((t) => (
          <Card key={t.id} title={<Badge tone={t.color}>{t.name}</Badge>}>
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
