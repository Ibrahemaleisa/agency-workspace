import Link from "next/link";
import clsx from "clsx";
import type { ComponentProps, ReactNode } from "react";
import { format, isBefore, parseISO, startOfDay, type Locale } from "date-fns";
import type { TaskStatus } from "@/db/schema";
import type { Tone } from "@/lib/constants";

export const cn = clsx;

/* ------------------------------------------------------------------ */
/* Layout                                                              */
/* ------------------------------------------------------------------ */

export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  breadcrumb?: { href: string; label: string }[];
}) {
  return (
    <div className="mb-6 md:mb-8">
      {breadcrumb && (
        <nav className="mb-2 flex flex-wrap items-center gap-1 text-xs text-zinc-500">
          {breadcrumb.map((b, i) => (
            <span key={b.href} className="flex items-center gap-1">
              {i > 0 && <span>/</span>}
              <Link href={b.href} className="hover:text-zinc-900">
                {b.label}
              </Link>
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 md:text-2xl">{title}</h1>
          {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function Card({
  title,
  actions,
  children,
  className,
  padded = true,
}: {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section
      className={cn(
        "min-w-0 rounded-xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgb(0_0_0/0.04),0_1px_8px_-2px_rgb(0_0_0/0.04)]",
        className,
      )}
    >
      {(title || actions) && (
        <header className="flex items-center justify-between gap-2 border-b border-zinc-100 px-4 py-3.5 md:px-5">
          <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
          {actions}
        </header>
      )}
      <div className={cn(padded && "p-4 md:p-5")}>{children}</div>
    </section>
  );
}

export function Stat({
  label,
  value,
  href,
  tone = "slate",
  hint,
  icon,
}: {
  label: string;
  value: ReactNode;
  href?: string;
  tone?: Tone;
  hint?: string;
  icon?: ReactNode;
}) {
  const body = (
    <div
      className={cn(
        "group h-full rounded-xl border border-zinc-200/80 bg-white p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition md:p-5",
        href && "hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs font-medium text-zinc-500 md:text-sm">{label}</div>
        {icon && (
          <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", toneIconBg[tone])}>
            {icon}
          </span>
        )}
      </div>
      <div className={cn("mt-1 text-2xl font-semibold tracking-tight tabular-nums md:text-3xl", toneText[tone])}>
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-zinc-400">{hint}</div>}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export function EmptyState({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-zinc-500">
      {icon && <span className="flex size-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">{icon}</span>}
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Badges                                                              */
/* ------------------------------------------------------------------ */

const toneClasses: Record<Tone, string> = {
  slate: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  blue: "bg-blue-50 text-blue-700 ring-blue-200",
  violet: "bg-violet-50 text-violet-700 ring-violet-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  pink: "bg-pink-50 text-pink-700 ring-pink-200",
  teal: "bg-teal-50 text-teal-700 ring-teal-200",
};

const toneText: Record<Tone, string> = {
  slate: "text-zinc-900",
  blue: "text-blue-700",
  violet: "text-violet-700",
  amber: "text-amber-700",
  green: "text-emerald-700",
  red: "text-red-600",
  pink: "text-pink-700",
  teal: "text-teal-700",
};

const toneIconBg: Record<Tone, string> = {
  slate: "bg-zinc-100 text-zinc-600",
  blue: "bg-blue-50 text-blue-600",
  violet: "bg-violet-50 text-violet-600",
  amber: "bg-amber-50 text-amber-600",
  green: "bg-emerald-50 text-emerald-600",
  red: "bg-red-50 text-red-600",
  pink: "bg-pink-50 text-pink-600",
  teal: "bg-teal-50 text-teal-600",
};

export const toneDot: Record<Tone, string> = {
  slate: "bg-zinc-400",
  blue: "bg-blue-500",
  violet: "bg-violet-500",
  amber: "bg-amber-500",
  green: "bg-emerald-500",
  red: "bg-red-500",
  pink: "bg-pink-500",
  teal: "bg-teal-500",
};

export function Badge({
  tone = "slate",
  children,
  className,
  dot,
}: {
  tone?: Tone | string;
  children: ReactNode;
  className?: string;
  dot?: boolean;
}) {
  const t = (tone as Tone) in toneClasses ? (tone as Tone) : "slate";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        toneClasses[t],
        className,
      )}
    >
      {dot && <span className={cn("size-1.5 rounded-full", toneDot[t])} />}
      {children}
    </span>
  );
}





export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-zinc-100", className)}>
      <div
        className={cn("h-full rounded-full", value >= 100 ? "bg-emerald-500" : "bg-ink")}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* People + dates                                                      */
/* ------------------------------------------------------------------ */

const avatarColors = [
  "bg-indigo-100 text-indigo-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-800",
  "bg-pink-100 text-pink-700",
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
  "bg-teal-100 text-teal-700",
];

export function Avatar({ name, size = "sm" }: { name?: string | null; size?: "xs" | "sm" | "md" }) {
  if (!name)
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full border border-dashed border-zinc-300 text-zinc-400",
          size === "xs" ? "size-5 text-[9px]" : size === "sm" ? "size-6 text-[10px]" : "size-8 text-xs",
        )}
      >
        ?
      </span>
    );
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return (
    <span
      title={name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
        avatarColors[hash % avatarColors.length],
        size === "xs" ? "size-5 text-[9px]" : size === "sm" ? "size-6 text-[10px]" : "size-8 text-xs",
      )}
    >
      {initials}
    </span>
  );
}


export function isOverdue(dueDate: string | null, status?: TaskStatus) {
  if (!dueDate || status === "completed") return false;
  return isBefore(parseISO(dueDate), startOfDay(new Date()));
}


export function formatDate(value: string | Date | null | undefined, fmt = "MMM d, yyyy", locale?: Locale) {
  if (!value) return "—";
  return format(typeof value === "string" ? parseISO(value) : value, fmt, { locale });
}

/* ------------------------------------------------------------------ */
/* Form controls                                                       */
/* ------------------------------------------------------------------ */

const buttonVariants = {
  primary: "bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm shadow-indigo-600/20",
  secondary: "bg-white text-zinc-800 ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 shadow-xs",
  ghost: "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
  danger: "bg-white text-red-600 ring-1 ring-inset ring-red-200 hover:bg-red-50",
  success: "bg-emerald-600 text-white hover:bg-emerald-500 shadow-xs",
};

export function buttonClass(variant: keyof typeof buttonVariants = "primary", size: "sm" | "md" = "md") {
  return cn(
    "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
    size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3.5 py-2 text-sm",
    buttonVariants[variant],
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: keyof typeof buttonVariants; size?: "sm" | "md" }) {
  return <button className={cn(buttonClass(variant, size), className)} {...props} />;
}

export function LinkButton({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: keyof typeof buttonVariants; size?: "sm" | "md" }) {
  return <Link className={cn(buttonClass(variant, size), className)} {...props} />;
}

export const inputClass =
  "block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-zinc-900 shadow-xs ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 focus:outline-none";

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-xs font-medium text-zinc-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-zinc-400">{hint}</span>}
    </label>
  );
}

export function Input(props: ComponentProps<"input">) {
  return <input {...props} className={cn(inputClass, props.className)} />;
}

export function Textarea(props: ComponentProps<"textarea">) {
  return <textarea rows={3} {...props} className={cn(inputClass, props.className)} />;
}

export function Select({
  options,
  placeholder,
  ...props
}: ComponentProps<"select"> & {
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <select {...props} className={cn(inputClass, "pe-8", props.className)}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Checkbox({ label, ...props }: ComponentProps<"input"> & { label: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700">
      <input
        type="checkbox"
        {...props}
        className="size-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
      />
      {label}
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Tables                                                              */
/* ------------------------------------------------------------------ */

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-start text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "border-b border-zinc-200 bg-zinc-50/60 px-4 py-2 text-start text-xs font-medium whitespace-nowrap text-zinc-500",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn("border-b border-zinc-100 px-4 py-2.5 align-middle", className)}>{children}</td>;
}

export const FILE_INPUT =
  "block w-full text-sm text-zinc-600 file:me-3 file:rounded-full file:border-0 file:bg-ink file:px-3.5 file:py-1.5 file:text-sm file:font-medium file:text-sand-100 hover:file:bg-zinc-800";

export const isImageType = (mime: string) => /^image\/(png|jpe?g|gif|webp|avif)$/.test(mime);
