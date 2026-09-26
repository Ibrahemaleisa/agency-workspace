"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
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
      setError("Enter your workspace address, for example app.youragency.com");
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
      <label htmlFor={id} className="text-sm font-medium">
        Workspace address
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
          ref={input}
          onChange={() => setError(null)}
          aria-invalid={!!error || undefined}
          aria-describedby={`${id}-help`}
          className="block h-12 w-full min-w-0 rounded-full sm:flex-1 border border-line bg-surface px-5 text-[0.95rem] placeholder:text-subtle focus:outline-none focus-visible:border-ink focus-visible:ring-4 focus-visible:ring-sand/60 aria-[invalid=true]:border-red-600"
        />
        <button type="submit" className={buttonClass("primary", "lg")}>
          Continue
          <ArrowRight aria-hidden className="size-4" />
        </button>
      </div>
      <p id={`${id}-help`} className={error ? "mt-2 text-sm text-red-700" : "mt-2 text-sm text-subtle"} role={error ? "alert" : undefined}>
        {error ?? "It’s in your welcome email, and usually on your agency’s own domain."}
      </p>
    </form>
  );
}
