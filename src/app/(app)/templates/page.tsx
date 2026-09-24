import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { moduleTemplates, type ModuleTemplate } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { TONES } from "@/lib/constants";
import { getT } from "@/lib/lang";
import { saveTemplate } from "@/server/admin-actions";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Badge, Card, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";

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
  const stages = template?.stages.map((s) => s.name + (s.clientApproval ? " *" : "")).join("\n") ?? "";
  const fields =
    template?.fields
      .map((f) => [f.label, f.type, f.options?.join(", ")].filter(Boolean).join(" | "))
      .join("\n") ?? "";
  return (
    <ActionForm action={saveTemplate} className="space-y-3" successMessage={m.saved}>
      {template && <input type="hidden" name="templateId" value={template.id} />}
      <div className="grid grid-cols-3 gap-3">
        <Field label={m.name} className="col-span-2">
          <Input name="name" defaultValue={template?.name} required />
        </Field>
        <Field label={m.color}>
          <Select name="color" defaultValue={template?.color ?? "slate"} options={TONES.map((t) => ({ value: t, label: t }))} />
        </Field>
      </div>
      <Field label={m.description}>
        <Input name="description" defaultValue={template?.description ?? ""} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={m.stages} hint={m.stagesHint}>
          <Textarea name="stages" rows={8} defaultValue={stages} className="font-mono text-xs" />
        </Field>
        <Field label={m.fields} hint={m.fieldsHint}>
          <Textarea name="fields" rows={8} defaultValue={fields} className="font-mono text-xs" />
        </Field>
      </div>
      <div className="flex justify-end">
        <SubmitButton size="sm">{template ? m.save : m.create}</SubmitButton>
      </div>
    </ActionForm>
  );
}
