/* The Operra wordmark and Live O, copied from the Operra brand system (never re-typeset). */
export function OperraWordmark({ className = "h-6 w-auto", onDark = false }: { className?: string; onDark?: boolean }) {
  const ring = onDark ? "#F6F6F3" : "#0B0D10";
  return (
    <svg viewBox="-8 4 268 78" role="img" aria-label="Operra" className={className}>
      <path d="M35.45 31.86 A16 16 0 1 1 24.14 20.55" fill="none" stroke={ring} strokeWidth="8" />
      <circle cx="31.31" cy="24.69" r="4" fill="#FF5A1F" />
      <g fill="none" stroke={ring} strokeWidth="8">
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

/** Status dot: done (ink), live (signal), next (hollow). */
export function Dot({ state }: { state: "done" | "live" | "next" }) {
  const cls =
    state === "done"
      ? "bg-[#0B0D10]"
      : state === "live"
        ? "bg-[#FF5A1F] motion-safe:animate-pulse"
        : "border-[1.5px] border-[#8C919A] bg-white";
  return <span aria-hidden className={`inline-block size-2.5 shrink-0 rounded-full ${cls}`} />;
}
