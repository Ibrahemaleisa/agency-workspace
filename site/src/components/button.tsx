import Link, { type LinkProps } from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";

/*
 * Buttons (brand system → Button). Primary actions are ink, not orange.
 * `signal` is reserved for the one decisive moment in a flow — at most one per screen.
 */
type Variant = "primary" | "secondary" | "signal" | "ghost" | "on-panel" | "on-panel-secondary";

const base =
  "group inline-flex items-center justify-center gap-2 rounded-md border font-medium whitespace-nowrap transition-colors duration-[120ms] disabled:pointer-events-none disabled:opacity-60";

const variants: Record<Variant, string> = {
  primary: "border-transparent bg-ink text-paper hover:bg-[#23272e]",
  secondary: "border-line-strong bg-surface text-ink hover:bg-paper",
  signal: "border-transparent bg-signal text-ink hover:bg-[#ff6d38]",
  ghost: "border-transparent text-ink hover:bg-ink/5",
  "on-panel": "border-transparent bg-paper text-ink hover:bg-surface",
  "on-panel-secondary": "border-on-panel/35 text-on-panel hover:border-on-panel/70",
};

const sizes = { md: "h-9 px-3.5 text-[14px]", lg: "h-11 px-5 text-[15px]" };

export function buttonClass(variant: Variant = "primary", size: keyof typeof sizes = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

export function ButtonLink<T extends string>({
  href,
  children,
  variant = "primary",
  size = "md",
  arrow,
  className,
  external,
  ...rest
}: {
  href: LinkProps<T>["href"] | string;
  children: ReactNode;
  variant?: Variant;
  size?: keyof typeof sizes;
  arrow?: boolean;
  className?: string;
  external?: boolean;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  const content = (
    <>
      {children}
      {arrow && <ArrowRight aria-hidden className="size-4" />}
    </>
  );
  if (external) {
    return (
      <a href={href as string} target="_blank" rel="noopener noreferrer" className={buttonClass(variant, size, className)} {...rest}>
        {content}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  }
  return (
    <Link href={href as LinkProps<T>["href"]} className={buttonClass(variant, size, className)} {...rest}>
      {content}
    </Link>
  );
}
