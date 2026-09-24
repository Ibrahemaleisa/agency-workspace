"use client";

import { useActionState, useEffect, useRef, type ComponentProps, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { buttonClass, cn, inputClass } from "./ui";
import type { ActionState } from "@/lib/action-state";

export function SubmitButton({
  children,
  pendingText,
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & {
  pendingText?: string;
  variant?: Parameters<typeof buttonClass>[0];
  size?: "sm" | "md";
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || props.disabled}
      className={cn(buttonClass(variant, size), className)}
      {...props}
    >
      {pending ? (pendingText ?? "Saving…") : children}
    </button>
  );
}

/**
 * Form bound to a server action returning ActionState.
 * Shows validation errors inline and optionally resets on success.
 */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess,
  successMessage,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  successMessage?: string;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const ref = useRef<HTMLFormElement>(null);
  const submitted = useRef<FormData | null>(null);
  useEffect(() => {
    const form = ref.current;
    if (!form) return;
    if (state?.ok && resetOnSuccess) form.reset();
    // React resets forms after an action; when it failed, put back what the user typed.
    if (state?.error && submitted.current) restoreValues(form, submitted.current);
  }, [state, resetOnSuccess]);
  return (
    <form ref={ref} action={formAction} onSubmit={(e) => (submitted.current = new FormData(e.currentTarget))} className={className}>
      {state?.error && (
        <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      )}
      {state?.ok && successMessage && (
        <div className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {successMessage}
        </div>
      )}
      {children}
    </form>
  );
}

/** Refill a form from submitted values (skips passwords and file inputs). */
export function restoreValues(form: HTMLFormElement, values: FormData) {
  for (const el of Array.from(form.elements)) {
    if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)) continue;
    if (!el.name || el.type === "password" || el.type === "file" || el.type === "hidden") continue;
    if (el instanceof HTMLInputElement && (el.type === "checkbox" || el.type === "radio")) {
      el.checked = values.getAll(el.name).includes(el.value);
    } else if (values.has(el.name)) {
      el.value = String(values.get(el.name));
    }
  }
}

/** A <select> that submits its parent form when changed (inline status changes, etc.). */
export function AutoSubmitSelect({
  options,
  className,
  ...props
}: ComponentProps<"select"> & { options: { value: string; label: string }[] }) {
  return (
    <select
      {...props}
      className={cn(inputClass, "py-1 pe-8", className)}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function ConfirmSubmit({
  message,
  children,
  variant = "danger",
  size = "sm",
}: {
  message: string;
  children: ReactNode;
  variant?: Parameters<typeof buttonClass>[0];
  size?: "sm" | "md";
}) {
  return (
    <button
      type="submit"
      className={buttonClass(variant, size)}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}

/** Periodically refreshes server components (lightweight "live" updates for chat/notifications). */
export function AutoRefresh({ intervalMs = 8000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);
  return null;
}
