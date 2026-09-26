import { cn } from "@/lib/cn";

/*
 * The Live O and the constructed lowercase wordmark, copied from the Operra brand system
 * (Logo component). Ring radius : stroke = 2 : 1, 60° opening at 1:30, dot diameter = stroke,
 * butt terminals. The opening never rotates or mirrors (also in RTL). The ring is never orange.
 */

/** `panel-graphic`: the deck-cover treatment — a quiet ring on panel with the signal dot. */
type Tone = "ink" | "on-panel" | "mono" | "panel-graphic";

const ringClass: Record<Tone, string> = {
  ink: "stroke-ink",
  "on-panel": "stroke-on-panel",
  mono: "stroke-ink",
  "panel-graphic": "stroke-line-panel",
};
const dotClass: Record<Tone, string> = {
  ink: "fill-signal",
  "on-panel": "fill-signal",
  mono: "fill-ink",
  "panel-graphic": "fill-signal",
};

/** Primary / reverse / mono wordmark. Minimum 64px wide on screen. */
export function Wordmark({ tone = "ink", className, title = "Operra" }: { tone?: Tone; className?: string; title?: string }) {
  return (
    <svg viewBox="-8 4 268 78" role="img" aria-label={title} className={cn("h-6 w-auto", className)}>
      <path className={ringClass[tone]} d="M35.45 31.86 A16 16 0 1 1 24.14 20.55" fill="none" strokeWidth="8" />
      <circle className={dotClass[tone]} cx="31.31" cy="24.69" r="4.0" />
      <g className={ringClass[tone]} fill="none" strokeWidth="8">
        <path d="M54 16 V74" />
        <circle cx="70" cy="36" r="16" />
        <path d="M104 36 H136 A16 16 0 1 0 132.26 46.28" />
        <path d="M154 16 V56 M154 36 A16 16 0 0 1 170 20 H175" />
        <path d="M185 16 V56 M185 36 A16 16 0 0 1 201 20 H206" />
        <circle cx="232" cy="36" r="16" />
        <path d="M248 16 V56" />
      </g>
    </svg>
  );
}

/** The Live O on its own: avatars, favicon, small spaces. Minimum 16px. */
export function LiveO({ tone = "ink", className }: { tone?: Tone; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={cn("size-6", className)}>
      <path className={ringClass[tone]} d="M51.32 26.82 A20 20 0 1 1 37.18 12.68" fill="none" strokeWidth="10" />
      <circle className={dotClass[tone]} cx="46.14" cy="17.86" r="5.0" />
    </svg>
  );
}
