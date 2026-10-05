import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-[1200px] px-4 sm:px-8", className)}>{children}</div>;
}

/* paper = bone page ground; surface = white band; panel = the lapis band (one or two per page). */
const tones = {
  paper: "bg-paper text-ink",
  surface: "bg-surface text-ink",
  panel: "bg-panel text-on-panel",
};

export type Tone = keyof typeof tones;

export function Section({
  children,
  tone = "paper",
  className,
  id,
  labelledBy,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
  id?: string;
  labelledBy?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn("relative py-16 sm:py-24", tones[tone], tone !== "panel" && "border-t border-line", className)}
    >
      {children}
    </section>
  );
}

/** Section marker: a short sentence-case label above a heading. Sections aren't a sequence, so no numbers. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function Marker({ children, index, onPanel }: { children: ReactNode; index?: number; onPanel?: boolean }) {
  return (
    <p className={cn("text-[13px] leading-5 font-medium", onPanel ? "text-on-panel-muted" : "text-muted")}>
      {children}
    </p>
  );
}

/** Section opener. Headlines are sentence case, tight, and have no full stop. */
export function SectionHeader({
  id,
  marker,
  index,
  title,
  lead,
  align = "left",
  onPanel,
  className,
  as: H = "h2",
}: {
  id?: string;
  marker?: ReactNode;
  index?: number;
  title: ReactNode;
  lead?: ReactNode;
  align?: "left" | "center";
  onPanel?: boolean;
  className?: string;
  as?: "h1" | "h2";
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {marker && (
        <Marker index={index} onPanel={onPanel}>
          {marker}
        </Marker>
      )}
      <H
        id={id}
        className={cn(
          "mt-4 font-semibold",
          H === "h1"
            ? "text-[40px] leading-[44px] tracking-[-0.03em] sm:text-[48px] sm:leading-[52px]"
            : "text-[32px] leading-[38px] tracking-[-0.02em] sm:text-[40px] sm:leading-[46px] sm:tracking-[-0.025em]",
        )}
      >
        {title}
      </H>
      {lead && (
        <p className={cn("mt-4 text-[17px] leading-[26px]", onPanel ? "text-on-panel-muted" : "text-muted")}>{lead}</p>
      )}
    </div>
  );
}
