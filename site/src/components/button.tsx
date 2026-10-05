import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { LocalLink } from "./local-link";

/*
 * Buttons (BRAND.md → Button). Primary actions are lapis: the brand colour is the call to action.
 * `signal` is kept as an alias of primary for older call sites.
 */
type Variant = "primary" | "secondary" | "signal" | "ghost" | "on-panel" | "on-panel-secondary";

const base =
  "group inline-flex items-center justify-center gap-2 rounded-md border font-medium whitespace-nowrap transition-colors duration-[120ms] disabled:pointer-events-none disabled:opacity-60";

const variants: Record<Variant, string> = {
  primary: "border-transparent bg-signal text-on-panel hover:bg-panel-deep",
  secondary: "border-line-strong bg-surface text-ink hover:bg-paper",
  signal: "border-transparent bg-signal text-on-panel hover:bg-panel-deep",
  ghost: "border-transparent text-ink hover:bg-ink/5",
  "on-panel": "border-transparent bg-paper text-signal hover:bg-surface",
  "on-panel-secondary": "border-on-panel/35 text-on-panel hover:border-on-panel/70",
};

const sizes = { md: "h-9 px-3.5 text-[14px]", lg: "h-11 px-5 text-[15px]" };

export function buttonClass(variant: Variant = "primary", size: keyof typeof sizes = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

/** A link styled as a button. Relative paths stay in the visitor's language; absolute URLs pass through. */
export function ButtonLink({
  href,
  children,
  variant = "primary",
  size = "md",
  arrow,
  className,
  external,
  newTabLabel = "(opens in a new tab)",
  ...rest
}: {
  href: string;
  children: ReactNode;
  variant?: Variant;
  size?: keyof typeof sizes;
  arrow?: boolean;
  className?: string;
  external?: boolean;
  /** Label for the "(opens in a new tab)" hint on external links. */
  newTabLabel?: string;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  const content = (
    <>
      {children}
      {arrow && <ArrowRight aria-hidden className="size-4" />}
    </>
  );
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={buttonClass(variant, size, className)} {...rest}>
        {content}
        <span className="sr-only"> {newTabLabel}</span>
      </a>
    );
  }
  return (
    <LocalLink href={href} className={buttonClass(variant, size, className)} {...rest}>
      {content}
    </LocalLink>
  );
}
