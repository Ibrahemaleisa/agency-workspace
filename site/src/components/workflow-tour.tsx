"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import type { WorkflowStep } from "@/content/en/workflow";
import { useLocale } from "@/i18n/provider";
import { cn } from "@/lib/cn";
import { StatusDot } from "./status-dot";

/**
 * Client → Project → Module → Task → Review → Approval → Delivery, one real screen per step.
 * The step track is drawn as a schematic: done steps ink, the current step signal, next steps hollow.
 * WAI-ARIA tabs: arrow keys / Home / End move between steps.
 * Frames are rendered on the server and passed in, so images stay optimised by next/image.
 */
export function WorkflowTour({ steps, frames }: { steps: WorkflowStep[]; frames: ReactNode[] }) {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const uid = useId();
  const { locale, ui } = useLocale();
  const t = ui.tour;
  // Arrow keys follow the reading direction: in Arabic, ← moves forward.
  const fwd = locale === "ar" ? -1 : 1;

  const select = (i: number, focus = false) => {
    const next = (i + steps.length) % steps.length;
    setActive(next);
    if (focus) tabs.current[next]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const moves: Record<string, number> = {
      ArrowRight: active + fwd,
      ArrowDown: active + 1,
      ArrowLeft: active - fwd,
      ArrowUp: active - 1,
      Home: 0,
      End: steps.length - 1,
    };
    if (e.key in moves) {
      e.preventDefault();
      select(moves[e.key], true);
    }
  };

  return (
    <div>
      <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        <div role="tablist" aria-label={t.label} className="flex min-w-max border-b border-line sm:min-w-0">
          {steps.map((s, i) => (
            <button
              key={s.id}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              role="tab"
              type="button"
              id={`${uid}-tab-${s.id}`}
              aria-selected={i === active}
              aria-controls={`${uid}-panel-${s.id}`}
              tabIndex={i === active ? 0 : -1}
              onClick={() => select(i)}
              onKeyDown={onKeyDown}
              className={cn(
                "group relative flex flex-1 flex-col items-start gap-2 px-1 pt-1 pb-4 text-start transition-colors sm:min-w-0",
                "min-w-[112px] after:absolute after:inset-x-0 after:-bottom-px after:h-0.5",
                i === active ? "after:bg-ink" : "after:bg-transparent",
              )}
            >
              <span className="flex w-full items-center">
                <StatusDot state={i < active ? "done" : i === active ? "live" : "draft"} pulse={false} />
                {i < steps.length - 1 && <span aria-hidden className="ms-2 h-px flex-1 bg-line-strong" />}
              </span>
              <span className="font-mono text-[11px] leading-4 tracking-[0.08em] text-muted">{String(i + 1).padStart(2, "0")}</span>
              <span className={cn("text-[14px] leading-5", i === active ? "font-semibold text-ink" : "text-muted group-hover:text-ink")}>
                {s.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {steps.map((s, i) => (
        <div
          key={s.id}
          role="tabpanel"
          id={`${uid}-panel-${s.id}`}
          aria-labelledby={`${uid}-tab-${s.id}`}
          hidden={i !== active}
          tabIndex={0}
          className="mt-8 grid gap-8 lg:mt-10 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:gap-12"
        >
          <div className="flex flex-col">
            <p className="font-mono text-[11px] leading-4 tracking-[0.08em] text-muted uppercase">
              {t.step} {String(i + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}
            </p>
            <h3 className="mt-3 text-[24px] leading-[30px] font-semibold tracking-[-0.015em]">{s.title}</h3>
            <p className="mt-3 text-[15px] leading-[22px] text-muted">{s.body}</p>
            <ul className="mt-6 divide-y divide-line border-y border-line">
              {s.points.map((p) => (
                <li key={p} className="flex gap-3 py-2.5 text-[14px] leading-5">
                  <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-ink" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex gap-2 lg:mt-auto lg:pt-8">
              <button
                type="button"
                onClick={() => select(active - 1)}
                className="inline-flex size-9 items-center justify-center rounded-md border border-line-strong bg-surface text-ink transition-colors hover:bg-paper"
              >
                <ArrowLeft aria-hidden className="size-4" />
                <span className="sr-only">{t.previous}</span>
              </button>
              <button
                type="button"
                onClick={() => select(active + 1)}
                className="inline-flex h-9 items-center gap-2 rounded-md bg-ink px-3.5 text-[14px] font-medium text-paper transition-colors hover:bg-[#23272e]"
              >
                {active === steps.length - 1 ? t.startOver : `${t.next} ${steps[active + 1].label}`}
                <ArrowRight aria-hidden className="size-4" />
              </button>
            </div>
          </div>
          <div className="order-first min-w-0 lg:order-none">{frames[i]}</div>
        </div>
      ))}
      <p className="sr-only" aria-live="polite">
        {`${t.step} ${active + 1}: ${steps[active].title}`}
      </p>
    </div>
  );
}
