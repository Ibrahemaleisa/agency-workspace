"use client";

import { useActionState, useEffect, useRef } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { submitContact, submitTrial, type FormState } from "@/app/actions";
import { site } from "@/lib/site";
import { buttonClass } from "./button";
import { SelectField, SpamGuard, TextArea, TextField } from "./form-fields";
import { TRIAL_ROLES as ROLES } from "@/content/roles";

function Status({ state }: { state: FormState }) {
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
          You can also email{" "}
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
  return (
    <button type="submit" disabled={pending} className={buttonClass(signal ? "signal" : "primary", "lg", "w-full sm:w-auto")}>
      {pending && <Loader2 aria-hidden className="size-4 animate-spin" />}
      {pending ? "Sending…" : children}
    </button>
  );
}

export function TrialForm() {
  const [state, action, pending] = useActionState(submitTrial, undefined);
  if (state?.ok) {
    return (
      <Success
        title="Request received"
        body="We’ll set up your workspace and reply by email with its address and your admin sign-in. Until then, the live demo agency is open."
      />
    );
  }
  const e = state?.fieldErrors ?? {};
  const v = state?.values ?? {};
  return (
    <form action={action} noValidate className="relative space-y-5" key={JSON.stringify(v)}>
      <Status state={state} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="name" label="Your name" autoComplete="name" required error={e.name} defaultValue={v.name} />
        <TextField name="email" type="email" label="Work email" autoComplete="email" required error={e.email} defaultValue={v.email} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="agency" label="Agency name" autoComplete="organization" required error={e.agency} defaultValue={v.agency} />
        <TextField name="website" label="Agency website" type="url" autoComplete="url" placeholder="https://" error={e.website} defaultValue={v.website} />
      </div>
      <SelectField
        name="role"
        label="Your role"
        options={ROLES}
        error={e.role}
        defaultValue={v.role}
      />
      <div className="grid gap-5 sm:grid-cols-3">
        <SelectField name="teamSize" label="Team size" required options={["1-5", "6-15", "16-50", "51+"]} error={e.teamSize} defaultValue={v.teamSize} />
        <SelectField
          name="agencyType"
          label="What you do"
          options={["Content & social", "Production", "Performance & paid media", "Full-service", "Other"]}
          error={e.agencyType}
          defaultValue={v.agencyType}
        />
        <SelectField name="language" label="Workspace language" required options={["English", "Arabic", "Both"]} error={e.language} defaultValue={v.language} />
      </div>
      <TextArea name="message" label="Anything we should know?" rows={4} placeholder="How you run projects today, tools you’re replacing, timing…" error={e.message} defaultValue={v.message} />
      <SpamGuard startedAt={v.startedAt} />
      <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center">
        <Submit pending={pending} signal>
          Request my workspace
        </Submit>
        <p className="text-[13px] leading-[18px] text-muted">We only use these details to set up your workspace and reply to you.</p>
      </div>
    </form>
  );
}

export function ContactForm() {
  const [state, action, pending] = useActionState(submitContact, undefined);
  if (state?.ok) {
    return <Success title="Message sent" body="We’ll reply to the email address you gave us." />;
  }
  const e = state?.fieldErrors ?? {};
  const v = state?.values ?? {};
  return (
    <form action={action} noValidate className="relative space-y-5" key={JSON.stringify(v)}>
      <Status state={state} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="name" label="Your name" autoComplete="name" required error={e.name} defaultValue={v.name} />
        <TextField name="email" type="email" label="Email" autoComplete="email" required error={e.email} defaultValue={v.email} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="agency" label="Agency" autoComplete="organization" error={e.agency} defaultValue={v.agency} />
        <SelectField name="topic" label="Topic" required options={["Sales", "Demo", "Existing workspace", "Other"]} error={e.topic} defaultValue={v.topic} />
      </div>
      <TextArea name="message" label="Message" rows={6} required error={e.message} defaultValue={v.message} />
      <SpamGuard startedAt={v.startedAt} />
      <Submit pending={pending}>Send message</Submit>
    </form>
  );
}
