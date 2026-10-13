import Link from "next/link";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import type { SessionUser } from "@/lib/auth";
import { getSaasT } from "@/lib/i18n-saas";
import { getLang } from "@/lib/lang";
import { hiddenTrackUsers, tutorialTrack } from "@/lib/tutorial-track";
import { hideTrack, restartTour } from "@/server/onboarding-actions";
import { RestartTour } from "./tour";
import { PreviewHideButton, TrackFrame } from "./tutorial-track-frame";
import { cn } from "./ui";

/**
 * "Getting started" for the signed-in person's role (owner, account manager, production, client).
 * The bar along the top is the track itself: one segment per step done, filled in the reading
 * direction (BRAND.md), whichever steps they were. The next step to do is highlighted; finished steps stay listed, ticked.
 */
export async function TutorialTrack({ user }: { user: SessionUser }) {
  if ((await hiddenTrackUsers()).includes(user.id)) return null;
  const [{ t: st }, lang, { flow, steps }] = await Promise.all([getSaasT(), getLang(), tutorialTrack(user)]);
  const c = st.track;
  const copy = c.flows[flow] as Record<string, { title: string; body: string; cta: string }>;
  const doneCount = steps.filter((s) => s.done).length;
  const complete = doneCount === steps.length;
  const next = steps.find((s) => !s.done)?.id;
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;

  return (
    <TrackFrame preview={user.readOnly}>
      <section
        aria-labelledby="track-title"
        data-testid="tutorial-track"
        className="mb-6 rounded-xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgb(0_0_0/0.04)]"
      >
        <header className="flex flex-wrap items-start justify-between gap-3 px-4 pt-4 md:px-5">
          <div className="min-w-0">
            <h2 id="track-title" className="text-sm font-semibold text-zinc-900">
              {complete ? c.doneTitle : c.title}
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500">{complete ? c.doneSub : c.sub}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-zinc-600 tabular-nums">
              {c.progress.replace("{done}", String(doneCount)).replace("{n}", String(steps.length))}
            </span>
            {user.readOnly ? (
              <PreviewHideButton label={c.hide} className={hideClass} />
            ) : (
              <form action={hideTrack}>
                <button className={hideClass}>{c.hide}</button>
              </form>
            )}
          </div>
        </header>

        {/* The track: filled from the start edge, one segment per step done; the next one tinted. */}
        <ol aria-hidden className="mt-3 flex gap-1 px-4 md:px-5">
          {steps.map((s, i) => (
            <li key={s.id} className={cn("h-1.5 flex-1 rounded-full", i < doneCount ? "bg-indigo-600" : i === doneCount ? "bg-indigo-200" : "bg-zinc-200")} />
          ))}
        </ol>

        {!complete && (
          <ol className="mt-4 grid overflow-hidden border-y border-zinc-200/70 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map((s, i) => {
              const k = copy[s.id];
              const isNext = s.id === next;
              return (
                <li key={s.id} className={cn("flex gap-3 p-4", isNext ? "bg-indigo-50/60" : "bg-white")} aria-current={isNext ? "step" : undefined}>
                  <span
                    className={cn(
                      "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                      s.done ? "bg-indigo-600 text-white" : isNext ? "bg-white text-zinc-900 ring-2 ring-indigo-600" : "bg-zinc-100 text-zinc-500",
                    )}
                  >
                    {s.done ? <Check aria-hidden className="size-3.5" /> : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-sm font-medium", s.done ? "text-zinc-500" : "text-zinc-900")}>
                      {k.title}
                      {s.done && <span className="sr-only"> ✓</span>}
                    </p>
                    {!s.done && <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">{k.body}</p>}
                    {!s.done && (
                      <Link
                        href={s.href}
                        className={cn(
                          "mt-2 inline-flex items-center gap-1 text-xs font-semibold",
                          isNext ? "text-indigo-700 hover:text-indigo-900" : "text-zinc-700 hover:text-zinc-900",
                        )}
                      >
                        {k.cta} <Arrow aria-hidden className="size-3.5" />
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        <footer className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-5">
          {user.readOnly ? <p className="text-xs text-zinc-500">{c.previewNote}</p> : <span />}
          <RestartTour label={c.replay} persist={!user.readOnly} action={restartTour} variant="link" />
        </footer>
      </section>
    </TrackFrame>
  );
}

const hideClass = "rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900";
