"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { useLocale } from "@/i18n/provider";
import { buttonClass } from "./button";

const KEY = "operra:last-workspace";
const HOST = /^(?=.{1,253}$)(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+(:\d{2,5})?$/i;

/** "https://app.acme.com/projects" → "app.acme.com" */
export function normalizeWorkspace(input: string): string | null {
  const host = input
    .trim()
    .replace(/^[a-z]+:\/\//i, "")
    .split(/[/?#]/)[0]
    .toLowerCase();
  return HOST.test(host) ? host : null;
}

/**
 * Every agency's workspace runs on its own address, so signing in means going there.
 * The last address used is remembered in this browser only.
 */
export function WorkspaceLogin() {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const { ui } = useLocale();
  const w = ui.workspace;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved && input.current && !input.current.value) input.current.value = saved;
    } catch {
      /* storage unavailable: ignore */
    }
  }, []);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const host = normalizeWorkspace(input.current?.value ?? "");
    if (!host) {
      setError(w.invalid);
      return;
    }
    try {
      localStorage.setItem(KEY, host);
    } catch {
      /* ignore */
    }
    window.location.assign(`https://${host}/login`);
  };

  return (
    <form onSubmit={onSubmit} noValidate>
      <label htmlFor={id} className="text-[14px] leading-5 font-medium">
        {w.label}
      </label>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <input
          id={id}
          type="text"
          inputMode="url"
          autoComplete="url"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="app.youragency.com"
          dir="ltr"
          ref={input}
          onChange={() => setError(null)}
          aria-invalid={!!error || undefined}
          aria-describedby={`${id}-help`}
          className="block h-11 w-full min-w-0 rounded-md border border-line-strong bg-surface px-3 font-mono text-[14px] placeholder:text-muted/80 aria-[invalid=true]:border-danger sm:flex-1"
        />
        <button type="submit" className={buttonClass("primary", "lg")}>
          {w.continue}
          <ArrowRight aria-hidden className="size-4" />
        </button>
      </div>
      <p id={`${id}-help`} className={error ? "mt-2 text-[13px] leading-[18px] text-danger" : "mt-2 text-[13px] leading-[18px] text-muted"} role={error ? "alert" : undefined}>
        {error ?? w.help}
      </p>
    </form>
  );
}
