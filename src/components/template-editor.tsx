"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import type { ModuleField, WorkflowStage } from "@/db/schema";
import type { Tone } from "@/lib/constants";
import { cn, inputClass, toneDot } from "./ui";

const TYPES: ModuleField["type"][] = ["text", "textarea", "number", "date", "url", "select"];

type Labels = {
  color: string;
  stages: string;
  stagesHint: string;
  fields: string;
  fieldsHint: string;
  stagePlaceholder: string;
  clientApproves: string;
  addStage: string;
  fieldLabel: string;
  fieldType: string;
  optionsPlaceholder: string;
  addField: string;
  noFields: string;
  moveUp: string;
  moveDown: string;
  remove: string;
  types: Record<ModuleField["type"], string>;
  colors: Record<string, string>;
};

type FieldRow = { key?: string; label: string; type: ModuleField["type"]; options: string };

function move<T>(list: T[], i: number, by: number) {
  const j = i + by;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

const iconButton =
  "inline-flex size-8 shrink-0 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:pointer-events-none disabled:opacity-30";

/**
 * Visual editor for a module template's colour, stages and fields. Posts them as JSON
 * (stagesJson / fieldsJson); existing fields keep their key so values already filled in survive a rename.
 */
export function TemplateEditor({
  labels,
  tones,
  initial,
}: {
  labels: Labels;
  tones: Tone[];
  initial: { color: string; stages: WorkflowStage[]; fields: ModuleField[] };
}) {
  const [color, setColor] = useState(initial.color);
  const [stages, setStages] = useState<WorkflowStage[]>(initial.stages.length ? initial.stages : [{ name: "" }]);
  const [fields, setFields] = useState<FieldRow[]>(
    initial.fields.map((f) => ({ key: f.key, label: f.label, type: f.type, options: f.options?.join(", ") ?? "" })),
  );

  const setStage = (i: number, patch: Partial<WorkflowStage>) =>
    setStages((s) => s.map((st, k) => (k === i ? { ...st, ...patch } : st)));
  const setField = (i: number, patch: Partial<FieldRow>) =>
    setFields((f) => f.map((fd, k) => (k === i ? { ...fd, ...patch } : fd)));

  const stagesJson = JSON.stringify(
    stages.filter((s) => s.name.trim()).map((s) => ({ name: s.name.trim(), ...(s.clientApproval ? { clientApproval: true } : {}) })),
  );
  const fieldsJson = JSON.stringify(
    fields
      .filter((f) => f.label.trim())
      .map((f) => ({
        key: f.key,
        label: f.label.trim(),
        type: f.type,
        ...(f.type === "select" ? { options: f.options.split(/[,،]/).map((o) => o.trim()).filter(Boolean) } : {}),
      })),
  );

  // The colour list may not include a colour saved before (e.g. amber); keep it selectable.
  const colorChoices = tones.includes(initial.color as Tone) ? tones : [...tones, initial.color as Tone];

  return (
    <div className="space-y-5">
      <input type="hidden" name="color" value={color} />
      <input type="hidden" name="stagesJson" value={stagesJson} />
      <input type="hidden" name="fieldsJson" value={fieldsJson} />

      <fieldset>
        <legend className="mb-1.5 block text-sm font-medium text-zinc-700">{labels.color}</legend>
        <div role="radiogroup" className="flex flex-wrap gap-1.5">
          {colorChoices.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={color === c}
              onClick={() => setColor(c)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition",
                color === c ? "bg-zinc-900 text-white ring-zinc-900" : "bg-white text-zinc-700 ring-zinc-200 hover:ring-zinc-400",
              )}
            >
              <span aria-hidden className={cn("size-2 rounded-full", toneDot[c] ?? "bg-zinc-400")} />
              {labels.colors[c] ?? c}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="block text-sm font-medium text-zinc-700">{labels.stages}</legend>
        <p className="mt-0.5 mb-2 text-xs text-zinc-500">{labels.stagesHint}</p>
        <ol className="divide-y divide-zinc-100 rounded-lg ring-1 ring-zinc-200">
          {stages.map((s, i) => (
            <li key={i} className="flex flex-wrap items-center gap-2 px-2 py-1.5 sm:flex-nowrap">
              <span aria-hidden className="w-5 shrink-0 text-center text-xs text-zinc-400 tabular-nums">
                {i + 1}
              </span>
              <input
                value={s.name}
                onChange={(e) => setStage(i, { name: e.target.value })}
                dir="auto"
                aria-label={`${labels.stagePlaceholder} ${i + 1}`}
                placeholder={labels.stagePlaceholder}
                className={cn(inputClass, "min-w-0 flex-1 basis-40 py-1.5")}
              />
              <label
                className={cn(
                  "inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition",
                  s.clientApproval ? "bg-amber-50 text-amber-800 ring-amber-300" : "text-zinc-500 ring-zinc-200 hover:ring-zinc-400",
                )}
              >
                <input
                  type="checkbox"
                  checked={!!s.clientApproval}
                  onChange={(e) => setStage(i, { clientApproval: e.target.checked })}
                  className="size-3.5 accent-amber-600"
                />
                {labels.clientApproves}
              </label>
              <span className="flex shrink-0">
                <button type="button" className={iconButton} disabled={i === 0} onClick={() => setStages((l) => move(l, i, -1))} aria-label={labels.moveUp} title={labels.moveUp}>
                  <ArrowUp className="size-4" />
                </button>
                <button type="button" className={iconButton} disabled={i === stages.length - 1} onClick={() => setStages((l) => move(l, i, 1))} aria-label={labels.moveDown} title={labels.moveDown}>
                  <ArrowDown className="size-4" />
                </button>
                <button type="button" className={iconButton} disabled={stages.length === 1} onClick={() => setStages((l) => l.filter((_, k) => k !== i))} aria-label={labels.remove} title={labels.remove}>
                  <X className="size-4" />
                </button>
              </span>
            </li>
          ))}
        </ol>
        <button type="button" onClick={() => setStages((l) => [...l, { name: "" }])} className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-zinc-700 hover:text-zinc-900">
          <Plus aria-hidden className="size-4" /> {labels.addStage}
        </button>
      </fieldset>

      <fieldset>
        <legend className="block text-sm font-medium text-zinc-700">{labels.fields}</legend>
        <p className="mt-0.5 mb-2 text-xs text-zinc-500">{labels.fieldsHint}</p>
        {fields.length === 0 ? (
          <p className="rounded-lg px-3 py-2.5 text-sm text-zinc-500 ring-1 ring-zinc-200">{labels.noFields}</p>
        ) : (
          <ul className="divide-y divide-zinc-100 rounded-lg ring-1 ring-zinc-200">
            {fields.map((f, i) => (
              <li key={i} className="space-y-1.5 px-2 py-1.5">
                <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                  <input
                    value={f.label}
                    onChange={(e) => setField(i, { label: e.target.value })}
                    dir="auto"
                    aria-label={labels.fieldLabel}
                    placeholder={labels.fieldLabel}
                    className={cn(inputClass, "min-w-0 flex-1 basis-40 py-1.5")}
                  />
                  <select
                    value={f.type}
                    onChange={(e) => setField(i, { type: e.target.value as ModuleField["type"] })}
                    aria-label={labels.fieldType}
                    className={cn(inputClass, "w-36 shrink-0 py-1.5 pe-8")}
                  >
                    {TYPES.map((t) => (
                      <option key={t} value={t}>
                        {labels.types[t]}
                      </option>
                    ))}
                  </select>
                  <button type="button" className={iconButton} onClick={() => setFields((l) => l.filter((_, k) => k !== i))} aria-label={labels.remove} title={labels.remove}>
                    <X className="size-4" />
                  </button>
                </div>
                {f.type === "select" && (
                  <input
                    value={f.options}
                    onChange={(e) => setField(i, { options: e.target.value })}
                    dir="auto"
                    aria-label={labels.optionsPlaceholder}
                    placeholder={labels.optionsPlaceholder}
                    className={cn(inputClass, "py-1.5")}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          onClick={() => setFields((l) => [...l, { label: "", type: "text", options: "" }])}
          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-zinc-700 hover:text-zinc-900"
        >
          <Plus aria-hidden className="size-4" /> {labels.addField}
        </button>
      </fieldset>
    </div>
  );
}
