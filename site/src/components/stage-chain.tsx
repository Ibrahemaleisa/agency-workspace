import { BadgeCheck } from "lucide-react";
import type { Stage } from "@/content/en/solutions";
import { getContent } from "@/i18n/server";
import { cn } from "@/lib/cn";

/** A module's workflow stages as chips; client-approval stages carry an ink outline and a check badge. */
export async function StageChain({ stages, size = "md" }: { stages: Stage[]; size?: "sm" | "md" }) {
  const { UI } = await getContent();
  return (
    <ol className="flex flex-wrap gap-1.5" aria-label={UI.workflowStages}>
      {stages.map((s, i) => (
        <li
          key={s.name}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xs border bg-surface",
            size === "sm" ? "px-2 py-0.5 text-[12px] leading-[18px]" : "px-2.5 py-1 text-[13px] leading-[18px]",
            s.clientApproval ? "border-ink text-ink" : "border-line text-ink",
          )}
        >
          <span className="font-mono text-[11px] text-muted">{String(i + 1).padStart(2, "0")}</span>
          {/* Starter stage names are English in both languages; isolate them in Arabic text. */}
          <bdi>{s.name}</bdi>
          {s.clientApproval && (
            <>
              <BadgeCheck aria-hidden className="size-3.5" />
              <span className="sr-only">{UI.clientApproval}</span>
            </>
          )}
        </li>
      ))}
    </ol>
  );
}
