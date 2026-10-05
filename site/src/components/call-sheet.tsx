import { getContent } from "@/i18n/server";
import { cn } from "@/lib/cn";
import type { CallSheetState } from "@/content/en/home";

/*
 * The call sheet (BRAND.md → Signature graphic): one agency week, Sunday to Thursday, with the
 * weekend hatched. Bars are schedule entries; they fill in once, in reading order. Amber is used
 * only for the row that's waiting on the client. The grid follows the page direction, so in
 * Arabic Sunday is on the right and bars grow leftwards.
 */

const barClass: Record<CallSheetState, string> = {
  done: "bg-signal",
  now: "bg-signal/30 ring-1 ring-inset ring-signal",
  client: "bg-client",
  planned: "bg-line",
};

export async function CallSheet({ className }: { className?: string }) {
  const { CALL_SHEET: t } = await getContent();
  // Task column + five working days + the weekend.
  const cols = "grid-cols-[minmax(0,2.3fr)_repeat(5,minmax(0,1fr))_minmax(0,0.45fr)]";

  return (
    <figure className={cn("overflow-hidden rounded-lg border border-line bg-surface", className)}>
      <figcaption className="flex items-baseline justify-between gap-4 border-b border-line px-4 py-3">
        <span className="text-[14px] leading-5 font-semibold">{t.title}</span>
        <span className="tabular text-[12px] leading-4 text-muted">{t.week}</span>
      </figcaption>

      <div role="table" aria-label={t.title} className="text-[12px] leading-4">
        <div role="row" className={cn("grid border-b border-line text-muted", cols)}>
          <span aria-hidden />
          {t.days.map((d) => {
            const [day, date] = d.split(" ");
            return (
              <span key={d} role="columnheader" className="tabular px-0.5 py-2 text-center">
                <span className="block truncate">{day}</span>
                <span className="block font-semibold text-ink">{date}</span>
              </span>
            );
          })}
          <span role="columnheader" className="bg-[repeating-linear-gradient(135deg,transparent_0_5px,var(--color-line)_5px_6px)]">
            <span className="sr-only">{t.weekend}</span>
          </span>
        </div>

        {t.rows.map((r, i) => (
          <div key={r.task} role="row" className={cn("relative grid items-center border-b border-line last:border-b-0", cols)}>
            <span role="cell" className="min-w-0 py-2.5 ps-4 pe-2">
              <span className="block truncate text-[13px] leading-[18px] font-medium text-ink">{r.task}</span>
              <span className="block truncate text-muted">{r.who}</span>
            </span>
            {/* weekend hatch */}
            <span
              aria-hidden
              className="col-start-7 row-start-1 h-full bg-[repeating-linear-gradient(135deg,transparent_0_5px,var(--color-line)_5px_6px)]"
            />
            <span
              role="cell"
              className="row-start-1 px-1 py-2.5"
              style={{ gridColumn: `${r.start + 2} / span ${r.span}` }}
            >
              <span
                className={cn("schedule-bar block h-2.5 rounded-full", barClass[r.state])}
                style={{ animationDelay: `${300 + i * 140}ms` }}
              />
              <span className="sr-only">
                {t.days[r.start]}
                {r.span > 1 ? ` – ${t.days[r.start + r.span - 1]}` : ""}: {t.legend[r.state]}
              </span>
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-line px-4 py-3 text-[12px] leading-4 text-muted">
        {(Object.keys(t.legend) as CallSheetState[]).map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <i aria-hidden className={cn("inline-block h-1.5 w-4 rounded-full", barClass[k])} />
            {t.legend[k]}
          </span>
        ))}
      </div>
    </figure>
  );
}
