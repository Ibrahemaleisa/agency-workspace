import Link, { type LinkProps } from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "light" | "ghost-light";

const base =
  "group inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap transition-[background-color,color,border-color,box-shadow] duration-200 disabled:pointer-events-none disabled:opacity-60";

const variants: Record<Variant, string> = {
  /* on light backgrounds */
  primary: "bg-ink text-white shadow-[0_1px_0_rgb(255_255_255/0.08)_inset] hover:bg-ink-3",
  secondary: "border border-line bg-surface text-ink hover:border-ink/25",
  /* on dark backgrounds */
  light: "bg-sand text-ink hover:bg-white",
  "ghost-light": "border border-white/15 text-white hover:border-white/35 hover:bg-white/5",
};

const sizes = { md: "h-10 px-4.5 text-[0.9rem]", lg: "h-12 px-6 text-[0.95rem]" };

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
      {arrow && <ArrowRight aria-hidden className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />}
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
