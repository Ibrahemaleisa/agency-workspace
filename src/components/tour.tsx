"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { TourTarget } from "@/lib/tour";

type Step = TourTarget & { title: string; body: string };
type Labels = { next: string; back: string; skip: string; finish: string; stepOf: string };
type Rect = { top: number; left: number; width: number; height: number };

const PREVIEW_KEY = "operra:preview-tour";
const RESTART_EVENT = "operra:tour-restart";

/**
 * Contextual tutorial. Each step highlights a real element ([data-tour="…"]) and, when needed,
 * opens the page it lives on. Progress is saved per user (or, in the read-only preview, in this tab).
 * Keyboard: → next, ← back, Esc skip.
 */
export function Tour({
  steps,
  initialStep,
  labels,
  save,
}: {
  steps: Step[];
  initialStep: number;
  labels: Labels;
  /** Persist progress; omitted in preview sessions. */
  save?: (step: number, status: "active" | "completed" | "skipped") => Promise<void>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  // Client-only component (see tour-client.tsx), so reading sessionStorage here is safe.
  const [step, setStep] = useState(() => {
    if (save) return initialStep;
    const saved = Number(sessionStorage.getItem(PREVIEW_KEY) ?? initialStep);
    return Number.isFinite(saved) ? saved : initialStep;
  });
  // Preview: a finished/skipped tour (-1) stays closed for this tab.
  const [open, setOpen] = useState(step >= 0);
  const [rect, setRect] = useState<Rect | null>(null);
  const current = steps[step];

  // "Restart the tutorial" (Guide page) in preview sessions, without a reload.
  useEffect(() => {
    const restart = () => {
      setStep(0);
      setOpen(true);
    };
    window.addEventListener(RESTART_EVENT, restart);
    return () => window.removeEventListener(RESTART_EVENT, restart);
  }, []);

  const persist = useCallback(
    (s: number, status: "active" | "completed" | "skipped") => {
      if (save) save(s, status).catch(() => {});
      else sessionStorage.setItem(PREVIEW_KEY, status === "active" ? String(s) : "-1");
    },
    [save],
  );

  const go = (next: number) => {
    if (next >= steps.length) {
      persist(next, "completed");
      setOpen(false);
      return;
    }
    const s = Math.max(0, next);
    setStep(s);
    persist(s, "active");
  };
  const skip = () => {
    persist(step, "skipped");
    setOpen(false);
  };

  // Open the step's page when needed.
  useEffect(() => {
    if (!open || !current?.path || current.path === pathname) return;
    router.push(current.path);
  }, [open, current?.path, pathname, router]);

  // Find and follow the highlighted element (it may render after navigation).
  useLayoutEffect(() => {
    if (!open || !current) return;
    let frame = 0;
    let tries = 0;
    const measure = () => {
      const el = current.anchor
        ? [...document.querySelectorAll<HTMLElement>(`[data-tour="${current.anchor}"]`)].find((e) => e.getClientRects().length > 0)
        : null;
      if (el) {
        if (tries === 0) el.scrollIntoView({ block: "nearest" });
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      } else {
        setRect(null);
      }
      if (!el && current.anchor && tries++ < 20) frame = window.setTimeout(measure, 150);
    };
    measure();
    const onMove = () => measure();
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      window.clearTimeout(frame);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [open, current, pathname]);

  useEffect(() => {
    if (open) dialogRef.current?.focus();
  }, [open, step]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") skip();
      else if (e.key === "ArrowRight" && document.documentElement.dir !== "rtl") go(step + 1);
      else if (e.key === "ArrowLeft" && document.documentElement.dir !== "rtl") go(step - 1);
      else if (e.key === "ArrowLeft" && document.documentElement.dir === "rtl") go(step + 1);
      else if (e.key === "ArrowRight" && document.documentElement.dir === "rtl") go(step - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!open || !current) return null;

  const pad = 6;
  const last = step === steps.length - 1;
  // Card placement: beside the element when there's room, otherwise below it; centred without one.
  const cardW = 340;
  let cardStyle: React.CSSProperties = { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  if (rect && typeof window !== "undefined") {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const rtl = document.documentElement.dir === "rtl";
    const roomEnd = rtl ? rect.left : vw - (rect.left + rect.width);
    if (roomEnd > cardW + 32 && rect.width < vw / 2) {
      const top = Math.min(Math.max(12, rect.top - 8), vh - 260);
      cardStyle = rtl ? { top, left: rect.left - cardW - 16 } : { top, left: rect.left + rect.width + 16 };
    } else {
      const below = rect.top + rect.height + 12;
      const top = below + 240 < vh ? below : Math.max(12, rect.top - 252);
      cardStyle = { top, left: Math.min(Math.max(12, rect.left), vw - cardW - 12) };
    }
  }

  return (
    <div className="fixed inset-0 z-[60]" aria-live="polite">
      {rect ? (
        <div
          aria-hidden
          className="pointer-events-none absolute rounded-lg ring-2 ring-white transition-all duration-200"
          style={{
            top: rect.top - pad,
            left: rect.left - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
            boxShadow: "0 0 0 9999px rgba(11,13,16,0.55)",
          }}
        />
      ) : (
        <div aria-hidden className="absolute inset-0 bg-[rgba(11,13,16,0.55)]" />
      )}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="absolute w-[min(340px,calc(100vw-24px))] rounded-xl bg-white p-5 text-zinc-900 shadow-2xl outline-none"
        style={cardStyle}
      >
        <p className="text-xs font-medium text-zinc-500">
          {labels.stepOf.replace("{i}", String(step + 1)).replace("{n}", String(steps.length))}
        </p>
        <h2 id={titleId} className="mt-1.5 text-base font-semibold">
          {current.title}
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{current.body}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <button type="button" onClick={skip} className="text-xs text-zinc-500 underline-offset-4 hover:text-zinc-900 hover:underline">
            {labels.skip}
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button type="button" onClick={() => go(step - 1)} className="rounded-lg px-3 py-1.5 text-sm font-medium ring-1 ring-zinc-300 hover:bg-zinc-50">
                {labels.back}
              </button>
            )}
            <button
              type="button"
              onClick={() => go(step + 1)}
              data-testid="tour-next"
              className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
            >
              {last ? labels.finish : labels.next}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Restart from the Guide page. Preview sessions restart locally (no write). */
export function RestartTour({ label, persist, action }: { label: string; persist: boolean; action: () => Promise<void> }) {
  if (persist) {
    return (
      <form action={action}>
        <button className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800">{label}</button>
      </form>
    );
  }
  return (
    <button
      type="button"
      className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
      onClick={() => {
        sessionStorage.setItem(PREVIEW_KEY, "0");
        window.dispatchEvent(new Event(RESTART_EVENT));
      }}
    >
      {label}
    </button>
  );
}
