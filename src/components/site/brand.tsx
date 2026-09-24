import { cn } from "../ui";

/**
 * The agency's mark: its uploaded logo, or a monogram of its initial when no logo is set.
 * `variant` is the background it sits on, so the monogram never disappears.
 */
export function BrandMark({
  logo,
  name,
  className,
  textClass = "text-base",
  variant = "dark",
}: {
  logo?: string | null;
  name: string;
  className?: string;
  /** Size of the initial when there is no logo. */
  textClass?: string;
  variant?: "light" | "dark";
}) {
  if (logo) {
    // eslint-disable-next-line @next/next/no-img-element -- data: URL stored in the database
    return <img src={logo} alt={name} className={cn("h-9 w-auto max-w-[9rem] shrink-0 object-contain", className)} />;
  }
  const initial = [...name.trim()][0]?.toUpperCase() ?? "•";
  return (
    <span
      role="img"
      aria-label={name}
      className={cn(
        "inline-flex aspect-square h-9 shrink-0 items-center justify-center rounded-[28%] font-bold",
        variant === "dark" ? "bg-sand-200 text-ink" : "bg-ink text-sand-200",
        className,
      )}
    >
      <span className={cn("leading-none", textClass)}>{initial}</span>
    </span>
  );
}

export function BrandLogo({
  logo,
  name,
  className,
}: {
  logo?: string | null;
  name: string;
  className?: string;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <BrandMark logo={logo} name={name} className="h-8" />
      <span className="font-display text-xl font-semibold tracking-tight text-white">{name}</span>
    </span>
  );
}
