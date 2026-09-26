import { BadgeCheck } from "lucide-react";
import type { Stage } from "@/content/solutions";
import { cn } from "@/lib/cn";

/** A module's workflow stages, with client-approval stages highlighted. */
export function StageChain({ stages, size = "md" }: { stages: Stage[]; size?: "sm" | "md" }) {
  return (
    <ol className="flex flex-wrap gap-1.5" aria-label="Workflow stages">
      {stages.map((s, i) => (
        <li
          key={s.name}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border",
            size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm",
            s.clientApproval ? "border-wait/30 bg-amber-50 text-wait" : "border-line bg-surface text-ink",
          )}
        >
          <span className="text-subtle tabular-nums">{i + 1}</span>
          {s.name}
          {s.clientApproval && (
            <>
              <BadgeCheck aria-hidden className="size-3.5" />
              <span className="sr-only">(client approval)</span>
            </>
          )}
        </li>
      ))}
    </ol>
  );
}
