import Link from "next/link";
import { differenceInCalendarDays, parseISO } from "date-fns";
import type { TaskStatus } from "@/db/schema";
import type { AppDict } from "@/lib/i18n-app";
import type { MatrixRow } from "@/server/queries";
import { cn } from "./ui";

const STATUS_COLS: TaskStatus[] = ["todo", "in_progress", "review", "waiting_client", "completed"];
type Health = "onTrack" | "atRisk" | "offTrack";

/** Progress vs. time + overdue work → a simple traffic-light health score. */
export function projectHealth(r: MatrixRow, today = new Date()) {
  const total = STATUS_COLS.reduce((n, s) => n + r[s], 0);
  const progress = total ? Math.round((r.completed / total) * 100) : 0;
  let timeUsed: number | null = null;
  if (r.startDate && r.endDate) {
    const span = Math.max(1, differenceInCalendarDays(parseISO(r.endDate), parseISO(r.startDate)));
    const used = differenceInCalendarDays(today, parseISO(r.startDate));
    timeUsed = Math.round(Math.min(1.5, Math.max(0, used / span)) * 100);
  }
  const gap = timeUsed === null ? 0 : progress - Math.min(timeUsed, 100);
  const pastEnd = timeUsed !== null && timeUsed > 100 && progress < 100;
  const health: Health =
    pastEnd || gap < -30 || r.overdue >= 3 ? "offTrack" : gap < -10 || r.overdue > 0 ? "atRisk" : "onTrack";
  return { total, progress, timeUsed, health };
}

const HEALTH_STYLE: Record<Health, string> = {
  onTrack: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  atRisk: "bg-amber-50 text-amber-800 ring-amber-600/25",
  offTrack: "bg-red-50 text-red-700 ring-red-600/20",
};
const HEALTH_DOT: Record<Health, string> = { onTrack: "bg-emerald-500", atRisk: "bg-amber-500", offTrack: "bg-red-500" };

export function ProjectMatrix({ rows, t }: { rows: MatrixRow[]; t: AppDict }) {
  const m = t.matrix;
  if (rows.length === 0) return <p className="px-4 py-8 text-center text-sm text-zinc-500">{m.empty}</p>;

  const data = rows.map((r) => ({ r, ...projectHealth(r) }));
  const max = Object.fromEntries(STATUS_COLS.map((s) => [s, Math.max(1, ...rows.map((r) => r[s]))])) as Record<TaskStatus, number>;
  const counts = { onTrack: 0, atRisk: 0, offTrack: 0 } as Record<Health, number>;
  data.forEach((d) => counts[d.health]++);

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 border-b border-zinc-100 p-4">
        {(["onTrack", "atRisk", "offTrack"] as Health[]).map((h) => (
          <div key={h} className={cn("rounded-lg px-3 py-2 ring-1 ring-inset", HEALTH_STYLE[h])}>
            <div className="text-xl font-semibold tabular-nums">{counts[h]}</div>
            <div className="text-xs font-medium">{m[h]}</div>
          </div>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-xs text-zinc-500">
              <th className="px-4 py-2.5 text-start font-medium">{m.project}</th>
              {STATUS_COLS.map((s) => (
                <th key={s} className="w-20 px-1 py-2.5 text-center font-medium">{t.taskStatus[s]}</th>
              ))}
              <th className="w-20 px-1 py-2.5 text-center font-medium">{m.overdue}</th>
              <th className="w-28 px-3 py-2.5 text-start font-medium">{m.progress}</th>
              <th className="w-28 px-3 py-2.5 text-start font-medium">{m.timeUsed}</th>
              <th className="w-32 px-4 py-2.5 text-start font-medium">{m.health}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {data.map(({ r, progress, timeUsed, health }) => (
              <tr key={r.id} className="hover:bg-zinc-50/60">
                <td className="max-w-56 px-4 py-2">
                  <Link href={`/projects/${r.id}`} className="block truncate font-medium hover:underline">{r.name}</Link>
                  <span className="block truncate text-xs text-zinc-500">{r.clientName}</span>
                </td>
                {STATUS_COLS.map((s) => {
                  const v = r[s];
                  const a = v ? 0.12 + 0.78 * (v / max[s]) : 0;
                  return (
                    <td key={s} className="p-1">
                      <Link
                        href={`/tasks?view=all&status=${s}&q=${encodeURIComponent(r.name)}`}
                        className={cn(
                          "flex h-9 items-center justify-center rounded-md text-sm font-semibold tabular-nums transition hover:ring-2 hover:ring-sand-300",
                          v === 0 ? "bg-zinc-50 text-zinc-300" : a > 0.5 ? "text-white" : "text-ink",
                        )}
                        style={v ? { backgroundColor: `rgb(28 27 25 / ${a.toFixed(2)})` } : undefined}
                      >
                        {v}
                      </Link>
                    </td>
                  );
                })}
                <td className="p-1">
                  <span
                    className={cn(
                      "flex h-9 items-center justify-center rounded-md text-sm font-semibold tabular-nums",
                      r.overdue ? "bg-red-50 text-red-600 ring-1 ring-red-200 ring-inset" : "bg-zinc-50 text-zinc-300",
                    )}
                  >
                    {r.overdue}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <Meter value={progress} className="bg-ink" />
                </td>
                <td className="px-3 py-2">
                  {timeUsed === null ? (
                    <span className="text-xs text-zinc-400">{m.noDates}</span>
                  ) : (
                    <Meter value={timeUsed} className={timeUsed > 100 ? "bg-red-500" : "bg-sand-400"} />
                  )}
                </td>
                <td className="px-4 py-2">
                  <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset", HEALTH_STYLE[health])}>
                    <span className={cn("size-1.5 rounded-full", HEALTH_DOT[health])} />
                    {m[health]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t border-zinc-100 px-4 py-2.5 text-xs text-zinc-400">{m.legend}</p>
    </div>
  );
}

function Meter({ value, className }: { value: number; className: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100">
        <div className={cn("h-full rounded-full", className)} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <span className="w-9 text-end text-xs text-zinc-500 tabular-nums">{value}%</span>
    </div>
  );
}
