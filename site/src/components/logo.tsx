import { useId } from "react";
import { cn } from "@/lib/cn";

/*
 * The Kashida mark and wordmarks (BRAND.md → Logo).
 *
 * Five rounded bars inside a circle: brief, production, review, approval, delivery.
 * The first three are complete, the last two are still filling. Like the Arabic kashida
 * (ـ), the bars grow from the start of the reading direction, so in Arabic the mark is
 * mirrored and fills from the right. Bars: height 9, gap 3.6, fully rounded ends.
 */

type Tone = "brand" | "on-panel" | "mono" | "panel-graphic";

const barFill: Record<Tone, string> = {
  brand: "fill-signal",
  "on-panel": "fill-on-panel",
  mono: "fill-ink",
  "panel-graphic": "fill-line-panel",
};

/** Bar lengths as a share of the full width, top to bottom. */
const BARS = [1, 1, 1, 0.62, 0.3];

export function Mark({
  tone = "brand",
  rtl = false,
  className,
  title,
}: {
  tone?: Tone;
  /** Fill from the right (Arabic). */
  rtl?: boolean;
  className?: string;
  title?: string;
}) {
  const clip = useId();
  return (
    <svg
      viewBox="0 0 64 64"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={cn("size-6 shrink-0", className)}
    >
      <defs>
        <clipPath id={clip}>
          <circle cx="32" cy="32" r="30" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`} className={barFill[tone]} transform={rtl ? "translate(64 0) scale(-1 1)" : undefined}>
        {BARS.map((w, i) => (
          <rect key={i} x={w === 1 ? -6 : -4.5} y={2 + i * 12.6} width={w === 1 ? 76 : 64 * w + 4.5} height="9" rx="4.5" />
        ))}
      </g>
    </svg>
  );
}

/** Kept name for older call sites: the mark on its own (avatars, favicon, small spaces). */
export const LiveO = Mark;

/**
 * Mark + wordmark. English "operra" in lowercase; Arabic "أوبيـرّا" with a kashida between
 * the ب and the ي, the stretch that gives the identity its name. Minimum 72px wide.
 */
export function Wordmark({
  tone = "brand",
  lang = "en",
  className,
  title = "Operra",
}: {
  tone?: Tone;
  lang?: "en" | "ar";
  className?: string;
  title?: string;
}) {
  const ar = lang === "ar";
  const text = tone === "on-panel" ? "text-on-panel" : "text-ink";
  return (
    <span role="img" aria-label={title} className={cn("inline-flex h-6 items-center gap-2", className)}>
      <Mark tone={tone === "panel-graphic" ? "on-panel" : tone} rtl={ar} className="h-full w-auto" />
      <span
        aria-hidden
        lang={ar ? "ar" : "en"}
        className={cn(
          "font-semibold whitespace-nowrap",
          text,
          ar ? "text-[1.15em] leading-none" : "text-[1.2em] leading-none tracking-[-0.04em]",
        )}
      >
        {ar ? "أوبيـــرّا" : "operra"}
      </span>
    </span>
  );
}
