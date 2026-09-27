"use client";

import { useActionState, useEffect, useRef } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { submitContact, submitTrial, type FormState } from "@/app/actions";
import { useLocale } from "@/i18n/provider";
import { site } from "@/lib/site";
import { buttonClass } from "./button";
import { SelectField, SpamGuard, TextArea, TextField } from "./form-fields";

function Status({ state }: { state: FormState }) {
  const { ui } = useLocale();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state?.error) ref.current?.focus();
  }, [state]);
  if (!state?.error) return null;
  return (
    <div ref={ref} tabIndex={-1} role="alert" className="rounded-md border border-danger/40 bg-surface px-3.5 py-2.5 text-[14px] leading-5 text-danger">
      {state.error}
      {!state.fieldErrors && site.contactEmail && (
        <>
          {" "}
          {ui.form.alsoEmail}{" "}
          <a className="underline" href={`mailto:${site.contactEmail}`}>
            {site.contactEmail}
          </a>
          .
        </>
      )}
    </div>
  );
}

function Success({ title, body }: { title: string; body: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <div ref={ref} tabIndex={-1} role="status" className="rounded-lg border border-line bg-surface p-8 focus:outline-none">
      <CheckCircle2 aria-hidden className="size-7 text-ink" />
      <h2 className="mt-4 text-[24px] leading-[30px] font-semibold tracking-[-0.015em]">{title}</h2>
      <p className="mt-2 text-[15px] leading-[22px] text-muted">{body}</p>
    </div>
  );
}

function Submit({ pending, children, signal }: { pending: boolean; children: string; signal?: boolean }) {
  const { ui } = useLocale();
  return (
    <button type="submit" disabled={pending} className={buttonClass(signal ? "signal" : "primary", "lg", "w-full sm:w-auto")}>
      {pending && <Loader2 aria-hidden className="size-4 animate-spin" />}
      {pending ? ui.form.sending : children}
    </button>
  );
}

export function TrialForm() {
  const { ui } = useLocale();
  const f = ui.form;
  const o = ui.options;
  const [state, action, pending] = useActionState(submitTrial, undefined);
  if (state?.ok) return <Success title={f.trialDoneTitle} body={f.trialDoneBody} />;
  const e = state?.fieldErrors ?? {};
  const v = state?.values ?? {};
  return (
    <form action={action} noValidate className="relative space-y-5" key={JSON.stringify(v)}>
      <Status state={state} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="name" label={f.name} autoComplete="name" required error={e.name} defaultValue={v.name} />
        <TextField name="email" type="email" label={f.workEmail} autoComplete="email" required error={e.email} defaultValue={v.email} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="agency" label={f.agencyName} autoComplete="organization" required error={e.agency} defaultValue={v.agency} />
        <TextField name="website" label={f.website} type="url" autoComplete="url" placeholder="https://" error={e.website} defaultValue={v.website} />
      </div>
      <SelectField name="role" label={f.yourRole} options={o.roles} error={e.role} defaultValue={v.role} />
      <div className="grid gap-5 sm:grid-cols-3">
        <SelectField name="teamSize" label={f.teamSize} required options={o.teamSize} error={e.teamSize} defaultValue={v.teamSize} />
        <SelectField name="agencyType" label={f.agencyType} options={o.agencyType} error={e.agencyType} defaultValue={v.agencyType} />
        <SelectField name="language" label={f.workspaceLanguage} required options={o.language} error={e.language} defaultValue={v.language} />
      </div>
      <TextArea name="message" label={f.notes} rows={4} placeholder={f.notesPlaceholder} error={e.message} defaultValue={v.message} />
      <SpamGuard startedAt={v.startedAt} />
      <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center">
        <Submit pending={pending} signal>
          {f.requestWorkspace}
        </Submit>
        <p className="text-[13px] leading-[18px] text-muted">{f.privacy}</p>
      </div>
    </form>
  );
}

export function ContactForm() {
  const { ui } = useLocale();
  const f = ui.form;
  const [state, action, pending] = useActionState(submitContact, undefined);
  if (state?.ok) return <Success title={f.contactDoneTitle} body={f.contactDoneBody} />;
  const e = state?.fieldErrors ?? {};
  const v = state?.values ?? {};
  return (
    <form action={action} noValidate className="relative space-y-5" key={JSON.stringify(v)}>
      <Status state={state} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="name" label={f.name} autoComplete="name" required error={e.name} defaultValue={v.name} />
        <TextField name="email" type="email" label={f.email} autoComplete="email" required error={e.email} defaultValue={v.email} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="agency" label={f.agency} autoComplete="organization" error={e.agency} defaultValue={v.agency} />
        <SelectField name="topic" label={f.topic} required options={ui.options.topic} error={e.topic} defaultValue={v.topic} />
      </div>
      <TextArea name="message" label={f.message} rows={6} required error={e.message} defaultValue={v.message} />
      <SpamGuard startedAt={v.startedAt} />
      <Submit pending={pending}>{f.sendMessage}</Submit>
    </form>
  );
}
