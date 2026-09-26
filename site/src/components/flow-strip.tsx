import { ArrowRight } from "lucide-react";
import { WORKFLOW } from "@/content/workflow";
import { cn } from "@/lib/cn";

/** Compact, static rendering of the workflow chain. */
export function FlowStrip({ tone = "light", className }: { tone?: "light" | "dark"; className?: string }) {
  const dark = tone === "dark";
  return (
    <ol aria-label="How work moves through Operra" className={cn("flex flex-wrap items-center gap-x-2 gap-y-2.5", className)}>
      {WORKFLOW.map((s, i) => (
        <li key={s.id} className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-full border px-3 py-1 text-[0.8rem] font-medium",
              dark ? "border-white/12 bg-white/5 text-white/80" : "border-line bg-surface text-ink",
              s.id === "approval" && (dark ? "border-sand/40 text-sand" : "border-sand-deep/40 bg-sand-soft"),
            )}
          >
            {s.label}
          </span>
          {i < WORKFLOW.length - 1 && (
            <ArrowRight aria-hidden className={cn("size-3.5", dark ? "text-white/30" : "text-subtle")} />
          )}
        </li>
      ))}
    </ol>
  );
}
