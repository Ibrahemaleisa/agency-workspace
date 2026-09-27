"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import type { Option } from "@/content/en/ui";
import { useLocale } from "@/i18n/provider";
import { cn } from "@/lib/cn";

/* Controls: radius-md, line-strong border (3:1), 2px focus ring, danger for errors. */
const control =
  "mt-1.5 block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-[15px] leading-[22px] text-ink placeholder:text-muted/80 transition-colors aria-[invalid=true]:border-danger";

type Base = {
  name: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  defaultValue?: string;
  className?: string;
};

function Wrap({ id, label, error, hint, required, className, children }: Base & { id: string; children: ReactNode }) {
  const { ui } = useLocale();
  return (
    <div className={className}>
      <label htmlFor={id} className="text-[14px] leading-5 font-medium">
        {label}
        {!required && <span className="ms-1.5 font-normal text-muted">{ui.form.optional}</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-[13px] leading-[18px] text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-[13px] leading-[18px] text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

const describedBy = (id: string, error?: string, hint?: ReactNode) =>
  error ? `${id}-error` : hint ? `${id}-hint` : undefined;

export function TextField({
  type = "text",
  autoComplete,
  placeholder,
  ...p
}: Base & { type?: "text" | "email" | "url"; autoComplete?: string; placeholder?: string }) {
  const id = useId();
  return (
    <Wrap id={id} {...p}>
      <input
        id={id}
        name={p.name}
        type={type}
        required={p.required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        defaultValue={p.defaultValue}
        aria-invalid={!!p.error || undefined}
        aria-describedby={describedBy(id, p.error, p.hint)}
        className={control}
      />
    </Wrap>
  );
}

export function TextArea({ rows = 4, placeholder, ...p }: Base & { rows?: number; placeholder?: string }) {
  const id = useId();
  return (
    <Wrap id={id} {...p}>
      <textarea
        id={id}
        name={p.name}
        rows={rows}
        required={p.required}
        placeholder={placeholder}
        defaultValue={p.defaultValue}
        aria-invalid={!!p.error || undefined}
        aria-describedby={describedBy(id, p.error, p.hint)}
        className={cn(control, "resize-y")}
      />
    </Wrap>
  );
}

export function SelectField({ options, placeholder, ...p }: Base & { options: readonly Option[]; placeholder?: string }) {
  const id = useId();
  const { ui } = useLocale();
  return (
    <Wrap id={id} {...p}>
      <select
        id={id}
        name={p.name}
        required={p.required}
        defaultValue={p.defaultValue ?? ""}
        aria-invalid={!!p.error || undefined}
        aria-describedby={describedBy(id, p.error, p.hint)}
        className={cn(control, "appearance-none bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat pe-10 rtl:bg-[left_0.75rem_center]")}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235a606b' stroke-width='1.5' stroke-linecap='square' stroke-linejoin='miter'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        }}
      >
        <option value="" disabled={p.required}>
          {placeholder ?? ui.form.select}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Wrap>
  );
}

/** Hidden anti-spam fields: a honeypot and the time the form was rendered. */
export function SpamGuard({ startedAt }: { startedAt?: string }) {
  const { ui, locale } = useLocale();
  // Set on first mount (pages are static, so a render-time timestamp would be the build time).
  // After a failed submit the form remounts with the original time, so the clock doesn't restart.
  const started = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (started.current && !started.current.value) started.current.value = String(Date.now());
  }, []);
  return (
    <>
      <div aria-hidden className="absolute -start-[9999px] h-px w-px overflow-hidden">
        <label>
          {ui.form.honeypot}
          <input type="text" name="company_url" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <input ref={started} type="hidden" name="startedAt" defaultValue={startedAt ?? ""} />
      <input type="hidden" name="locale" value={locale} />
    </>
  );
}
