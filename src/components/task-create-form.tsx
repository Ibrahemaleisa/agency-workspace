import type { ProjectModule } from "@/db/schema";
import { PRIORITIES } from "@/lib/constants";
import { createTask } from "@/server/task-actions";
import { ActionForm, SubmitButton } from "./forms";
import { Checkbox, FILE_INPUT, Field, Input, Select, Textarea } from "./ui";
import { getT } from "@/lib/lang";

export async function TaskCreateForm({
  projectId,
  modules,
  people,
  canAssign,
  canShare,
  defaultAssigneeId,
}: {
  projectId: string;
  modules: ProjectModule[];
  people: { id: string; name: string }[];
  canAssign: boolean;
  canShare: boolean;
  defaultAssigneeId: string;
}) {
  const { t } = await getT();
  const f = t.taskForm;
  const moduleOptions = modules.flatMap((m) => [
    { value: `${m.id}::`, label: `${m.name} ${f.noStage}` },
    ...m.stages.map((s) => ({ value: `${m.id}::${s.name}`, label: `${m.name} › ${s.name}` })),
  ]);
  return (
    <ActionForm action={createTask} className="space-y-3">
      <input type="hidden" name="projectId" value={projectId} />
      <div className="grid gap-3 sm:grid-cols-6">
        <Field label={f.title} className="sm:col-span-6">
          <Input name="title" required placeholder={f.titlePlaceholder} />
        </Field>
        <Field label={f.moduleStage} className="sm:col-span-2">
          <Select name="moduleStage" placeholder={f.general} options={moduleOptions} />
        </Field>
        <Field label={f.assignee} className="sm:col-span-2">
          {canAssign ? (
            <Select
              name="assigneeId"
              defaultValue={defaultAssigneeId}
              placeholder={t.common.unassigned}
              options={people.map((p) => ({ value: p.id, label: p.name }))}
            />
          ) : (
            <Input disabled value={f.me} />
          )}
        </Field>
        <Field label={f.priority}>
          <Select name="priority" defaultValue="medium" options={PRIORITIES.map((p) => ({ value: p.value, label: t.priority[p.value] }))} />
        </Field>
        <Field label={f.dueDate}>
          <Input type="date" name="dueDate" />
        </Field>
        <Field label={f.description} className="sm:col-span-6">
          <Textarea name="description" rows={2} />
        </Field>
        <Field label={t.media.attachments} hint={t.media.attachmentsHint} className="sm:col-span-6">
          <input type="file" name="files" multiple className={FILE_INPUT} />
        </Field>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-4">
          {canShare && (
            <>
              <Checkbox name="clientVisible" label={f.visibleToClient} />
              <Checkbox name="requiresApproval" label={f.requiresApproval} />
            </>
          )}
        </div>
        <SubmitButton>{f.create}</SubmitButton>
      </div>
    </ActionForm>
  );
}
