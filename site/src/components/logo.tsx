import { cn } from "@/lib/cn";

/**
 * Operra mark: a loop that doesn't quite close — work that keeps moving —
 * with one node for the item in flight.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-7", className)}>
      <rect width="32" height="32" rx="8" fill="currentColor" />
      <path
        d="M22.4 11.2A8 8 0 1 0 24 16"
        fill="none"
        stroke="var(--logo-accent, #e8dcc8)"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <circle cx="24" cy="11.2" r="2.4" fill="var(--logo-accent, #e8dcc8)" />
    </svg>
  );
}

export function Logo({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={tone === "light" ? "text-sand [--logo-accent:#0b0b0c]" : "text-ink"} />
      <span className={cn("text-[1.2rem] font-semibold tracking-[-0.035em]", tone === "light" ? "text-white" : "text-ink")}>
        Operra
      </span>
    </span>
  );
}
