import { cn } from "@/lib/cn";

/**
 * The status dot — the logo's dot as the product's state grammar. States differ in shape and
 * lightness, not hue alone. Marketing uses only the neutral states plus `live`
 * (success/warning/danger/info are product-only). Always paired with a text label.
 */
export type DotState = "draft" | "queued" | "live" | "done";

export function StatusDot({ state, className, pulse = true }: { state: DotState; className?: string; pulse?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-2.5 shrink-0 rounded-full",
        state === "draft" && "border-[1.5px] border-line-strong bg-surface",
        state === "queued" && "bg-muted",
        state === "live" && cn("bg-signal", pulse && "animate-signal"),
        state === "done" && "bg-ink",
        className,
      )}
    />
  );
}
