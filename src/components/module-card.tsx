import { Check } from "lucide-react";
import type { ProjectModule } from "@/db/schema";
import type { TaskRow } from "@/server/queries";
import { summarizeModule } from "@/lib/modules";
import { getT } from "@/lib/lang";
import { TaskTable } from "./lists";
import { Badge, ProgressBar, cn, formatDate } from "./ui";

export async function ModuleCard({
  mod,
  allTasks,
  visibleTasks,
  editableStatus,
}: {
  mod: ProjectModule;
  /** Every task in the module (status/stage only) — used for progress. */
  allTasks: { stage: string | null; status: TaskRow["status"] }[];
  /** Tasks the current user may see in detail. */
  visibleTasks: TaskRow[];
  editableStatus: boolean;
}) {
  const { t, locale } = await getT();
  const summary = summarizeModule(mod, allTasks);
  const currentLabel = summary.currentStage === "Done" ? t.taskStatus.completed : summary.currentStage;
  const filledFields = mod.fields.filter((f) => mod.fieldValues[f.key]);

  return (
    <section className="rounded-xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4">
        <div className="flex items-center gap-2">
          <Badge tone={mod.color}>{mod.name}</Badge>
          <span className="text-sm text-zinc-500">
            {t.projects.currentStage}: <span className="font-medium text-zinc-900">{currentLabel}</span>
          </span>
        </div>
        <div className="flex w-48 items-center gap-2">
          <ProgressBar value={summary.progress} />
          <span className="text-xs text-zinc-500 tabular-nums">{summary.progress}%</span>
        </div>
      </header>

      {/* Workflow stepper */}
      <ol className="flex gap-1 overflow-x-auto px-4 py-3">
        {summary.stages.map((s, i) => {
          const current = s.name === summary.currentStage;
          return (
            <li key={s.name} className="flex min-w-0 flex-1 flex-col gap-1" title={`${s.name}${s.clientApproval ? ` (${t.projects.clientApprovalStage})` : ""}`}>
              <div
                className={cn(
                  "h-1.5 rounded-full",
                  s.complete ? "bg-emerald-500" : current ? "bg-indigo-500" : s.started ? "bg-indigo-200" : "bg-zinc-200",
                )}
              />
              <span
                className={cn(
                  "flex items-center gap-1 truncate text-[11px] whitespace-nowrap",
                  current ? "font-semibold text-zinc-900" : s.complete ? "text-zinc-500" : "text-zinc-400",
                )}
              >
                {s.complete ? <Check className="size-3 shrink-0 text-emerald-600" /> : <span className="tabular-nums">{i + 1}.</span>}
                {s.name}
                {s.clientApproval && <span className="text-amber-600">●</span>}
              </span>
            </li>
          );
        })}
      </ol>

      {filledFields.length > 0 && (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 border-t border-zinc-100 px-4 py-3 text-sm sm:grid-cols-4">
          {filledFields.map((f) => (
            <div key={f.key} className="min-w-0">
              <dt className="text-xs text-zinc-500">{f.label}</dt>
              <dd className="truncate text-zinc-800">
                {f.type === "date"
                  ? formatDate(mod.fieldValues[f.key], undefined, locale)
                  : f.type === "url"
                    ? (
                      <a href={mod.fieldValues[f.key]} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                        {t.projects.link}
                      </a>
                    )
                    : mod.fieldValues[f.key]}
              </dd>
            </div>
          ))}
        </dl>
      )}

      <div className="border-t border-zinc-100">
        <TaskTable
          tasks={visibleTasks}
          showProject={false}
          editableStatus={editableStatus}
          empty={t.projects.noVisibleTasks}
        />
      </div>
    </section>
  );
}
