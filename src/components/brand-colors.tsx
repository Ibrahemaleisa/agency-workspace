"use client";

import { useState } from "react";

/** Two colour pickers with a live preview of how the brand will look. */
export function BrandColors({
  primary,
  accent,
  name,
  labels,
}: {
  primary: string;
  accent: string;
  name: string;
  labels: { primary: string; primaryHint: string; accent: string; accentHint: string; preview: string; button: string; badge: string };
}) {
  const [p, setP] = useState(primary);
  const [a, setA] = useState(accent);
  const initial = [...name.trim()][0]?.toUpperCase() ?? "•";
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div className="space-y-4">
        <ColorField name="primaryColor" label={labels.primary} hint={labels.primaryHint} value={p} onChange={setP} />
        <ColorField name="accentColor" label={labels.accent} hint={labels.accentHint} value={a} onChange={setA} />
      </div>
      <div>
        <div className="mb-1 text-xs font-medium text-zinc-700">{labels.preview}</div>
        <div className="overflow-hidden rounded-xl border border-zinc-200" aria-hidden="true">
          <div className="flex items-center gap-2.5 px-4 py-3" style={{ background: p }}>
            <span className="flex size-8 items-center justify-center rounded-[28%] text-sm font-bold" style={{ background: a, color: p }}>
              {initial}
            </span>
            <span className="text-sm font-semibold text-white">{name}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 bg-white px-4 py-4">
            <span className="rounded-lg px-3 py-1.5 text-sm font-medium text-white" style={{ background: p }}>
              {labels.button}
            </span>
            <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: a, color: p }}>
              {labels.badge}
            </span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100">
              <span className="block h-full w-2/3 rounded-full" style={{ background: p }} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorField({
  name,
  label,
  hint,
  value,
  onChange,
}: {
  name: string;
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-zinc-700">{label}</span>
      <span className="flex items-center gap-3">
        <input
          type="color"
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-14 cursor-pointer rounded-lg border border-zinc-300 bg-white p-1"
        />
        <code className="rounded bg-zinc-100 px-2 py-1 text-xs" dir="ltr">
          {value}
        </code>
      </span>
      <span className="mt-1 block text-xs text-zinc-400">{hint}</span>
    </label>
  );
}
