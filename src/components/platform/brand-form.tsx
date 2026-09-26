"use client";

import { useActionState, useState, type CSSProperties } from "react";
import { brandVars } from "@/lib/brand-css";
import type { ActionState } from "@/lib/action-state";
import { buttonClass, inputClass } from "../ui";
import { BrandMark } from "../site/brand";

type Labels = {
  logo: string;
  logoHint: string;
  removeLogo: string;
  primary: string;
  primaryHint: string;
  accent: string;
  accentHint: string;
  preview: string;
  contrast: string;
  back: string;
  continue: string;
  nav: string[];
  stats: string[];
  button: string;
  badge: string;
  greeting: string;
};

const HEX = /^#[0-9a-f]{6}$/i;

/**
 * Logo + colours with a live preview of the workspace shell. The preview uses the same palette
 * maths as the product (brandVars), so what you see is what your workspace will look like.
 */
export function BrandForm({
  action,
  labels,
  name,
  initial,
  backHref,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  labels: Labels;
  name: string;
  initial: { logo: string | null; primary: string; accent: string };
  backHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [primary, setPrimary] = useState(initial.primary);
  const [accent, setAccent] = useState(initial.accent);
  const [logo, setLogo] = useState<string | null>(initial.logo);
  const [removed, setRemoved] = useState(false);

  const vars = brandVars({ primary: HEX.test(primary) ? primary : initial.primary, accent: HEX.test(accent) ? accent : initial.accent });

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12">
      <form action={formAction} className="space-y-5 rounded-xl border border-[#E3E4E0] bg-white p-5 sm:p-6">
        {state?.error && <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>}
        <div>
          <span className="mb-1 block text-sm font-medium">{labels.logo}</span>
          <div className="flex items-center gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-xl" style={{ background: vars["--color-ink"] }}>
              <div style={vars as CSSProperties}>
                <BrandMark logo={logo} name={name} />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <input
                type="file"
                name="logo"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="block w-full text-sm file:me-3 file:rounded-md file:border-0 file:bg-zinc-900 file:px-3 file:py-1.5 file:text-sm file:text-white"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setRemoved(false);
                  const reader = new FileReader();
                  reader.onload = () => setLogo(String(reader.result));
                  reader.readAsDataURL(f);
                }}
              />
              <p className="mt-1 text-xs text-zinc-500">{labels.logoHint}</p>
              {logo && (
                <button
                  type="button"
                  className="mt-1 text-xs text-zinc-600 underline"
                  onClick={() => {
                    setLogo(null);
                    setRemoved(true);
                  }}
                >
                  {labels.removeLogo}
                </button>
              )}
              <input type="hidden" name="removeLogo" value={removed ? "1" : "0"} />
            </div>
          </div>
        </div>
        {(
          [
            ["primaryColor", labels.primary, labels.primaryHint, primary, setPrimary],
            ["accentColor", labels.accent, labels.accentHint, accent, setAccent],
          ] as const
        ).map(([field, label, hint, value, set]) => (
          <div key={field}>
            <label className="mb-1 block text-sm font-medium" htmlFor={field}>
              {label}
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                aria-label={label}
                value={HEX.test(value) ? value : "#000000"}
                onChange={(e) => set(e.target.value)}
                className="h-10 w-14 cursor-pointer rounded-md border border-zinc-300 bg-white p-1"
              />
              <input
                id={field}
                name={field}
                value={value}
                onChange={(e) => set(e.target.value)}
                pattern="#[0-9a-fA-F]{6}"
                dir="ltr"
                className={`${inputClass} font-mono`}
              />
            </div>
            <p className="mt-1 text-xs text-zinc-500">{hint}</p>
          </div>
        ))}
        <p className="text-xs text-zinc-500">{labels.contrast}</p>
        <div className="flex items-center justify-between gap-3 pt-2">
          <a href={backHref} className={buttonClass("ghost")}>
            {labels.back}
          </a>
          <button type="submit" disabled={pending} className={buttonClass("primary")}>
            {labels.continue}
          </button>
        </div>
      </form>

      <figure aria-label={labels.preview} className="min-w-0">
        <figcaption className="mb-3 font-mono text-[11px] tracking-[0.08em] text-[#5A606B] uppercase">{labels.preview}</figcaption>
        <div style={vars as CSSProperties} className="overflow-hidden rounded-xl border border-[#E3E4E0] bg-[#f6f5f2] shadow-sm">
          <div className="flex min-h-[320px]">
            <aside className="w-40 shrink-0 bg-ink p-3 text-white sm:w-48">
              <div className="flex items-center gap-2">
                <BrandMark logo={logo} name={name} />
                <span className="truncate text-sm font-semibold">{name}</span>
              </div>
              <ul className="mt-5 space-y-1 text-xs">
                {labels.nav.map((n, i) => (
                  <li
                    key={n}
                    className={i === 0 ? "rounded-md bg-white/10 px-2 py-1.5 font-medium text-sand-200" : "px-2 py-1.5 text-white/70"}
                  >
                    {n}
                  </li>
                ))}
              </ul>
            </aside>
            <div className="min-w-0 flex-1 p-4">
              <p className="text-sm font-semibold text-zinc-900">{labels.greeting}</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {labels.stats.map((st, i) => (
                  <div key={st} className="rounded-lg border border-zinc-200 bg-white p-2.5">
                    <p className="text-[10px] text-zinc-500">{st}</p>
                    <p className="mt-0.5 text-lg font-semibold text-zinc-900">{[4, 2, 3, 7][i]}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white">{labels.button}</span>
                <span className="rounded-full bg-sand-100 px-2 py-0.5 text-[11px] font-medium text-sand-900">{labels.badge}</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-200">
                <div className="h-full w-2/3 rounded-full bg-indigo-600" />
              </div>
            </div>
          </div>
        </div>
      </figure>
    </div>
  );
}
