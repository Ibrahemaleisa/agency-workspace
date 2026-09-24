import type { Client } from "@/db/schema";
import type { ActionState } from "@/lib/action-state";
import { ActionForm, SubmitButton } from "./forms";
import { Checkbox, Field, Input, Textarea } from "./ui";
import { getT } from "@/lib/lang";

export async function ClientForm({
  action,
  client,
  people,
  teamIds = [],
  submitLabel,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  client?: Client;
  people: { id: string; name: string; title: string | null }[];
  teamIds?: string[];
  submitLabel: string;
}) {
  const { t } = await getT();
  const f = t.clientForm;
  return (
    <ActionForm action={action} className="space-y-4" successMessage={f.saved}>
      {client && <input type="hidden" name="clientId" value={client.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={f.company}>
          <Input name="name" required defaultValue={client?.name} />
        </Field>
        <Field label={f.industry}>
          <Input name="industry" defaultValue={client?.industry ?? ""} />
        </Field>
        <Field label={f.contact}>
          <Input name="contactName" defaultValue={client?.contactName ?? ""} />
        </Field>
        <Field label={f.contactEmail}>
          <Input name="contactEmail" type="email" defaultValue={client?.contactEmail ?? ""} />
        </Field>
        <Field label={f.phone}>
          <Input name="phone" defaultValue={client?.phone ?? ""} />
        </Field>
        <Field label={f.website}>
          <Input name="website" defaultValue={client?.website ?? ""} placeholder="https://" />
        </Field>
        <Field label={f.notes} className="sm:col-span-2" hint={f.notesHint}>
          <Textarea name="notes" defaultValue={client?.notes ?? ""} />
        </Field>
      </div>
      <fieldset>
        <legend className="mb-2 text-xs font-medium text-zinc-700">{f.team}</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {people.map((p) => (
            <Checkbox key={p.id} name="teamIds" value={p.id} defaultChecked={teamIds.includes(p.id)} label={p.name} />
          ))}
        </div>
      </fieldset>
      {client ? (
        <Checkbox name="active" defaultChecked={client.active} label={f.active} />
      ) : (
        <input type="hidden" name="active" value="on" />
      )}
      <div className="flex justify-end">
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </ActionForm>
  );
}
