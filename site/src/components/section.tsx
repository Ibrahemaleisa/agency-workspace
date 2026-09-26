import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-[1200px] px-5 sm:px-8", className)}>{children}</div>;
}

const tones = {
  paper: "bg-paper text-ink",
  white: "bg-surface text-ink",
  dark: "bg-ink text-white",
};

export function Section({
  children,
  tone = "paper",
  className,
  id,
  labelledBy,
}: {
  children: ReactNode;
  tone?: keyof typeof tones;
  className?: string;
  id?: string;
  labelledBy?: string;
}) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={cn("relative py-20 sm:py-28", tones[tone], className)}>
      {children}
    </section>
  );
}

export function Eyebrow({ children, tone = "light" }: { children: ReactNode; tone?: "light" | "dark" }) {
  return (
    <p
      className={cn(
        "text-[0.8rem] font-medium tracking-[0.08em] uppercase",
        tone === "dark" ? "text-sand/80" : "text-sand-deep",
      )}
    >
      {children}
    </p>
  );
}

export function SectionHeader({
  id,
  eyebrow,
  title,
  lead,
  align = "left",
  tone = "light",
  className,
  as: H = "h2",
}: {
  id?: string;
  eyebrow?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  align?: "left" | "center";
  tone?: "light" | "dark";
  className?: string;
  as?: "h1" | "h2";
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && <Eyebrow tone={tone}>{eyebrow}</Eyebrow>}
      <H
        id={id}
        className={cn(
          "mt-3 font-semibold tracking-[-0.035em]",
          H === "h1" ? "text-[2.5rem] leading-[1.05] sm:text-6xl" : "text-[2rem] leading-[1.1] sm:text-[2.75rem]",
        )}
      >
        {title}
      </H>
      {lead && (
        <p className={cn("mt-5 text-lg leading-relaxed", tone === "dark" ? "text-white/65" : "text-muted")}>{lead}</p>
      )}
    </div>
  );
}
