import { getContent } from "@/i18n/server";
import { cn } from "@/lib/cn";
import type { DotState } from "./status-dot";

export type SchematicNode = { label: string; note?: string; state: DotState };

/**
 * Stages as kashida bars: each stage is a rounded bar that is filled (done), amber and breathing
 * (live: the approval waiting on the client), or empty (next). Bars run in the reading direction:
 * horizontal from `sm`, vertical on phones. Stages are a real sequence, so they're numbered.
 */
export async function Schematic({ nodes, label, className }: { nodes: SchematicNode[]; label: string; className?: string }) {
  const { UI } = await getContent();
  return (
    <ol aria-label={label} className={cn("grid gap-4 sm:grid-flow-col sm:auto-cols-fr sm:gap-2", className)}>
      {nodes.map((n, i) => (
        <li key={n.label} className="flex gap-3 sm:block">
          <span
            aria-hidden
            className={cn(
              "w-2 shrink-0 rounded-full sm:block sm:h-2.5 sm:w-full",
              n.state === "done" && "bg-signal",
              n.state === "live" && "animate-signal bg-client",
              n.state === "client" && "bg-client",
              (n.state === "draft" || n.state === "queued") && "bg-line",
            )}
          />
          <div className="sm:mt-3 sm:pe-3">
            <p className="tabular text-[12px] leading-4 text-muted">{i + 1}</p>
            <p className="mt-0.5 text-[14px] leading-5 font-medium">
              {n.label}
              <span className="sr-only">{n.state === "live" ? UI.schematic.live : n.state === "done" ? UI.schematic.done : UI.schematic.next}</span>
            </p>
            {n.note && <p className="mt-0.5 text-[13px] leading-[18px] text-muted">{n.note}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
