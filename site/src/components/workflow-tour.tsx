"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronRight } from "lucide-react";
import type { WorkflowStep } from "@/content/workflow";
import { cn } from "@/lib/cn";

/**
 * Client → Project → Module → Task → Review → Approval → Delivery, one real screen per step.
 * WAI-ARIA tabs: arrow keys / Home / End move between steps.
 * Frames are rendered on the server and passed in, so images stay optimised by next/image.
 */
export function WorkflowTour({
  steps,
  frames,
  compact,
}: {
  steps: WorkflowStep[];
  frames: ReactNode[];
  compact?: boolean;
}) {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const uid = useId();

  const select = (i: number, focus = false) => {
    const next = (i + steps.length) % steps.length;
    setActive(next);
    if (focus) tabs.current[next]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const moves: Record<string, number> = {
      ArrowRight: active + 1,
      ArrowDown: active + 1,
      ArrowLeft: active - 1,
      ArrowUp: active - 1,
      Home: 0,
      End: steps.length - 1,
    };
    if (e.key in moves) {
      e.preventDefault();
      select(moves[e.key], true);
    }
  };

  const step = steps[active];

  return (
    <div>
      <div className="-mx-5 overflow-x-auto px-5 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        <div
          role="tablist"
          aria-label="Operra workflow"
          className="inline-flex min-w-full items-center gap-1 rounded-full border border-line bg-surface p-1.5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] lg:flex lg:w-full lg:justify-between"
        >
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1 lg:flex-1 lg:last:flex-none">
              <button
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
                  "flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-200",
                  i === active ? "bg-ink text-white" : "text-muted hover:bg-paper hover:text-ink",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "grid size-5 place-items-center rounded-full text-[11px] tabular-nums",
                    i === active ? "bg-sand text-ink" : i < active ? "bg-sand-soft text-ink" : "bg-paper text-subtle",
                  )}
                >
                  {i < active ? <Check className="size-3" strokeWidth={2.5} /> : i + 1}
                </span>
                {s.label}
              </button>
              {i < steps.length - 1 && (
                <ChevronRight aria-hidden className="size-4 shrink-0 text-line lg:mx-auto" strokeWidth={2} />
              )}
            </div>
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
          className="mt-8 grid gap-8 focus-visible:outline-offset-8 lg:mt-10 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:gap-12"
        >
          <div className="flex flex-col">
            <p className="text-sm text-subtle tabular-nums">
              Step {i + 1} of {steps.length}
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{s.title}</h3>
            <p className="mt-3 leading-relaxed text-muted">{s.body}</p>
            {!compact && (
              <ul className="mt-6 space-y-3 border-t border-line pt-6">
                {s.points.map((p) => (
                  <li key={p} className="flex gap-3 text-[0.95rem]">
                    <Check aria-hidden className="mt-1 size-4 shrink-0 text-sand-deep" strokeWidth={2.25} />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-8 flex gap-2 lg:mt-auto lg:pt-8">
              <button
                type="button"
                onClick={() => select(active - 1)}
                className="inline-flex size-10 items-center justify-center rounded-full border border-line bg-surface text-ink transition-colors hover:border-ink/25"
              >
                <ArrowLeft aria-hidden className="size-4" />
                <span className="sr-only">Previous step</span>
              </button>
              <button
                type="button"
                onClick={() => select(active + 1)}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-sm font-medium text-white transition-colors hover:bg-ink-3"
              >
                {active === steps.length - 1 ? "Start over" : `Next: ${steps[active + 1].label}`}
                <ArrowRight aria-hidden className="size-4" />
              </button>
            </div>
          </div>
          <div className="order-first min-w-0 lg:order-none">{frames[i]}</div>
        </div>
      ))}
      <p className="sr-only" aria-live="polite">
        {`Step ${active + 1}: ${step.title}`}
      </p>
    </div>
  );
}
