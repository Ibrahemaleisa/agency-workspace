/*
 * The Operra Kashida mark and wordmark (BRAND.md → Logo), as used on Operra's own screens.
 * Five rounded stage bars in a circle; the last two are still filling. In Arabic the mark is
 * mirrored so it fills from the right, like a kashida stretching in the reading direction.
 */
const BARS = [1, 1, 1, 0.62, 0.3];

export function OperraMark({ className = "size-6", onDark = false, rtl = false }: { className?: string; onDark?: boolean; rtl?: boolean }) {
  const fill = onDark ? "#F7F7F4" : "#1F3FBF";
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={className}>
      <defs>
        <clipPath id="operra-mark-clip">
          <circle cx="32" cy="32" r="30" />
        </clipPath>
      </defs>
      <g clipPath="url(#operra-mark-clip)" fill={fill} transform={rtl ? "translate(64 0) scale(-1 1)" : undefined}>
        {BARS.map((w, i) => (
          <rect key={i} x={w === 1 ? -6 : -4.5} y={2 + i * 12.6} width={w === 1 ? 76 : 64 * w + 4.5} height="9" rx="4.5" />
        ))}
      </g>
    </svg>
  );
}

/** Mark + wordmark: "operra" in English, "أوبيـــرّا" (with its kashida) in Arabic. */
export function OperraWordmark({
  className = "h-6",
  onDark = false,
  lang = "en",
}: {
  className?: string;
  onDark?: boolean;
  lang?: "en" | "ar";
}) {
  const ar = lang === "ar";
  return (
    <span role="img" aria-label="Operra" className={`inline-flex items-center gap-2 ${className}`}>
      <OperraMark className="h-full w-auto" onDark={onDark} rtl={ar} />
      <span
        aria-hidden
        lang={ar ? "ar" : "en"}
        className={`font-semibold leading-none whitespace-nowrap ${onDark ? "text-[#F7F7F4]" : "text-[#15171C]"} ${ar ? "text-[1.15em]" : "text-[1.2em] tracking-[-0.04em]"}`}
        style={{ fontFamily: '"Alexandria Variable", system-ui, sans-serif' }}
      >
        {ar ? "أوبيـــرّا" : "operra"}
      </span>
    </span>
  );
}

/** Stage state: done (lapis), live (lapis, breathing), next (empty). Amber is only for waiting on the client. */
export function Dot({ state }: { state: "done" | "live" | "next" }) {
  const cls =
    state === "done"
      ? "bg-[#15171C]"
      : state === "live"
        ? "bg-[#1F3FBF] motion-safe:animate-pulse"
        : "border-[1.5px] border-[#8D929C] bg-white";
  return <span aria-hidden className={`inline-block size-2.5 shrink-0 rounded-full ${cls}`} />;
}
