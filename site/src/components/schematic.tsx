import { getContent } from "@/i18n/server";
import { cn } from "@/lib/cn";
import { StatusDot, type DotState } from "./status-dot";

export type SchematicNode = { label: string; note?: string; state: DotState };

/**
 * Schematics, not illustration: 1px hairlines, status-dot nodes, mono labels,
 * at most one signal (live) dot per drawing. Horizontal from `sm`, vertical on phones.
 */
export async function Schematic({ nodes, label, className }: { nodes: SchematicNode[]; label: string; className?: string }) {
  const { UI } = await getContent();
  return (
    <ol aria-label={label} className={cn("grid gap-0 sm:grid-flow-col sm:auto-cols-fr", className)}>
      {nodes.map((n, i) => {
        const last = i === nodes.length - 1;
        return (
          <li key={n.label} className="relative flex gap-3 pb-5 sm:block sm:pb-0">
            {/* node + connector */}
            <div className="flex flex-col items-center sm:flex-row">
              <StatusDot state={n.state} className="mt-1.5 sm:mt-0" />
              {!last && <span aria-hidden className="mt-1.5 w-px flex-1 bg-line-strong sm:mt-0 sm:ms-2 sm:h-px sm:w-auto" />}
            </div>
            <div className="sm:mt-3 sm:pe-3">
              <p className="font-mono text-[11px] leading-4 tracking-[0.08em] text-muted">{String(i + 1).padStart(2, "0")}</p>
              <p className="mt-0.5 text-[14px] leading-5 font-medium">
                {n.label}
                <span className="sr-only">{n.state === "live" ? UI.schematic.live : n.state === "done" ? UI.schematic.done : UI.schematic.next}</span>
              </p>
              {n.note && <p className="mt-0.5 text-[13px] leading-[18px] text-muted">{n.note}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
