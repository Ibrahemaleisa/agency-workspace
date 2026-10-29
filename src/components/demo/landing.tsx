"use client";

import { useState, type CSSProperties } from "react";
import { useFormStatus } from "react-dom";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CalendarDays,
  Check,
  CheckSquare,
  FolderKanban,
  Languages,
  LayoutDashboard,
  Layers,
  Loader2,
  MessagesSquare,
  type LucideIcon,
} from "lucide-react";
import { brandVars } from "@/lib/brand-css";
import type { Lang } from "@/lib/i18n";
import type { DemoDict } from "@/lib/i18n-demo";
import { startDemo } from "@/server/demo-actions";
import { LangSwitch } from "@/components/site/lang-switch";
import { cn } from "@/components/ui";

/** Colour pairs to start from: [main (dark), accent (light)]. */
const PRESETS: [string, string][] = [
  ["#0f3d3e", "#f2c14e"],
  ["#13294b", "#8fd3fe"],
  ["#3b1f4a", "#f4b6c2"],
  ["#1f3d2b", "#d9e8a5"],
  ["#4a1d12", "#f6c9a8"],
  ["#0a0a0a", "#e8dcc8"],
];

const ROLE_ICONS = { admin: LayoutDashboard, employee: CheckSquare, client: BadgeCheck } as const;
const FEATURE_ICONS: LucideIcon[] = [Layers, BadgeCheck, CalendarDays, MessagesSquare, BarChart3, Languages];

/**
 * The public demo's landing page. Everything the visitor picks (name, colours) re-tints this page
 * and the workspace preview live, and goes with them into their private copy of the system.
 */
export function DemoLanding({ lang, t, notice }: { lang: Lang; t: DemoDict; notice: string | null }) {
  const [name, setName] = useState("");
  const [[primary, accent], setColors] = useState<[string, string]>(PRESETS[0]);
  const shownName = name.trim() || t.studio.namePlaceholder;
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;

  return (
    <div
      style={brandVars({ primary, accent }) as CSSProperties}
      className="min-h-screen bg-[#f6f5f2] text-zinc-900"
    >
      {/* ---------------- Header ---------------- */}
      <header className="sticky top-0 z-30 border-b border-zinc-900/5 bg-[#f6f5f2]/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <a href="#top" className="flex min-w-0 items-center gap-2.5">
            <Monogram name={shownName} className="size-8 text-sm" />
            <span className="truncate font-semibold tracking-tight">{name.trim() || t.product}</span>
          </a>
          <nav className="flex items-center gap-1 text-sm sm:gap-2">
            <a href="#features" className="hidden rounded-full px-3 py-1.5 text-zinc-600 hover:text-ink md:block">
              {t.nav.features}
            </a>
            <a href="#yours" className="hidden rounded-full px-3 py-1.5 text-zinc-600 hover:text-ink md:block">
              {t.nav.yours}
            </a>
            <a href="/login" className="hidden rounded-full px-3 py-1.5 text-zinc-600 hover:text-ink sm:block">
              {t.nav.signIn}
            </a>
            <LangSwitch lang={lang} next="/" tone="light" />
          </nav>
        </div>
      </header>

      <main id="top">
        {notice && (
          <p role="status" className="mx-auto mt-6 max-w-6xl px-4 sm:px-6">
            <span className="block rounded-xl bg-white px-4 py-3 text-sm text-zinc-700 ring-1 ring-zinc-200">{notice}</span>
          </p>
        )}

        {/* ---------------- Hero: the product, in the visitor's colours ---------------- */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-14 pb-20 sm:px-6 lg:grid-cols-[1fr_1.15fr] lg:pt-20">
          <div>
            <h1 className="text-[2.5rem] leading-[1.1] font-semibold tracking-[-0.025em] text-balance sm:text-[3.4rem]">{t.hero.title}</h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-zinc-600">{t.hero.sub}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#studio"
                className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                {t.hero.cta} <Arrow aria-hidden className="size-4" />
              </a>
              <a href="#features" className="rounded-full px-6 py-3 text-sm font-semibold ring-1 ring-zinc-300 hover:ring-ink">
                {t.hero.secondary}
              </a>
            </div>
          </div>
          <AppPreview name={shownName} t={t.preview} />
        </section>

        {/* ---------------- Studio: make it yours, then enter ---------------- */}
        <section id="studio" className="scroll-mt-20 px-4 pb-24 sm:px-6">
          <form action={startDemo} className="mx-auto max-w-6xl rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-zinc-200 sm:p-10">
            <input type="hidden" name="name" value={name.trim()} />
            <input type="hidden" name="primary" value={primary} />
            <input type="hidden" name="accent" value={accent} />
            <h2 className="text-3xl font-semibold tracking-tight text-balance">{t.studio.title}</h2>
            <p className="mt-3 max-w-2xl text-zinc-600">{t.studio.sub}</p>

            <ol className="mt-10 grid gap-10 lg:grid-cols-[1fr_1fr_1.4fr]">
              <Step n={1} title={t.studio.nameStep}>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={60}
                  placeholder={t.studio.namePlaceholder}
                  aria-label={t.studio.nameStep}
                  data-testid="demo-name"
                  className="block w-full rounded-xl border-0 bg-[#f6f5f2] px-4 py-3 text-base ring-1 ring-zinc-200 ring-inset placeholder:text-zinc-400 focus:ring-2 focus:ring-ink focus:outline-none"
                />
              </Step>

              <Step n={2} title={t.studio.colorStep}>
                <div className="flex flex-wrap gap-2" role="group" aria-label={t.studio.presets}>
                  {PRESETS.map(([p, a]) => {
                    const on = p === primary && a === accent;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setColors([p, a])}
                        aria-pressed={on}
                        aria-label={`${p} / ${a}`}
                        className={cn("relative size-9 overflow-hidden rounded-full ring-offset-2 transition", on ? "ring-2 ring-zinc-900" : "ring-1 ring-zinc-200 hover:scale-105")}
                      >
                        <span className="absolute inset-0" style={{ background: p }} />
                        <span className="absolute inset-y-0 end-0 w-1/2" style={{ background: a }} />
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <ColorInput label={t.studio.primary} value={primary} onChange={(v) => setColors([v, accent])} />
                  <ColorInput label={t.studio.accent} value={accent} onChange={(v) => setColors([primary, v])} />
                </div>
              </Step>

              <Step n={3} title={t.studio.roleStep}>
                <div className="grid gap-3">
                  {(["admin", "employee", "client"] as const).map((role) => (
                    <RoleButton key={role} role={role} title={t.studio.roles[role].title} body={t.studio.roles[role].body} pending={t.studio.entering} Arrow={Arrow} />
                  ))}
                </div>
              </Step>
            </ol>
            <p className="mt-8 flex items-start gap-2 text-sm text-zinc-500">
              <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-indigo-600" />
              {t.studio.private}
            </p>
          </form>
        </section>

        {/* ---------------- Features ---------------- */}
        <section id="features" className="scroll-mt-20 border-t border-zinc-900/5 px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{t.features.title}</h2>
            <ul className="mt-12 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {t.features.items.map((f, i) => {
                const Icon = FEATURE_ICONS[i];
                return (
                  <li key={f.title}>
                    <span className="flex size-10 items-center justify-center rounded-xl bg-ink text-sand-200">
                      <Icon aria-hidden className="size-5" />
                    </span>
                    <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                    <p className="mt-1.5 leading-relaxed text-zinc-600">{f.body}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* ---------------- Shaped around you ---------------- */}
        <section id="yours" className="scroll-mt-16 bg-ink px-4 py-24 text-white sm:px-6">
          <div className="mx-auto max-w-6xl">
            <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{t.yours.title}</h2>
            <p className="mt-4 max-w-xl text-lg text-white/70">{t.yours.sub}</p>
            <ul className="mt-12 grid gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-2">
              {t.yours.items.map((y) => (
                <li key={y.title} className="bg-ink p-7">
                  <h3 className="flex items-center gap-2.5 text-lg font-semibold">
                    <span aria-hidden className="h-4 w-1 rounded-full bg-sand-200" />
                    {y.title}
                  </h3>
                  <p className="mt-2 leading-relaxed text-white/70">{y.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ---------------- Closing ---------------- */}
        <section className="px-4 py-24 text-center sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{t.closing.title}</h2>
          <a
            href="#studio"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            {t.closing.cta} <Arrow aria-hidden className="size-4" />
          </a>
        </section>
      </main>

      <footer className="border-t border-zinc-900/5 px-4 py-8 text-center text-sm text-zinc-500 sm:px-6">{t.footer}</footer>
    </div>
  );
}

function Monogram({ name, className }: { name: string; className?: string }) {
  const initial = [...name.trim()][0]?.toUpperCase() ?? "•";
  return (
    <span aria-hidden className={cn("inline-flex shrink-0 items-center justify-center rounded-[28%] bg-ink font-bold text-sand-200", className)}>
      {initial}
    </span>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li>
      <h3 className="mb-4 flex items-center gap-2.5 font-semibold">
        <span className="flex size-7 items-center justify-center rounded-full bg-sand-200 text-sm text-ink tabular-nums">{n}</span>
        {title}
      </h3>
      {children}
    </li>
  );
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center gap-2.5 rounded-xl bg-[#f6f5f2] px-3 py-2 ring-1 ring-zinc-200">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="size-7 shrink-0 cursor-pointer rounded-md border-0 bg-transparent p-0"
      />
      <span className="min-w-0 text-xs leading-tight">
        <span className="block font-medium">{label}</span>
        <span className="font-mono text-zinc-500 uppercase" dir="ltr">
          {value}
        </span>
      </span>
    </label>
  );
}

/** One submit button per role; while the copy is being prepared every button waits. */
function RoleButton({
  role,
  title,
  body,
  pending,
  Arrow,
}: {
  role: "admin" | "employee" | "client";
  title: string;
  body: string;
  pending: string;
  Arrow: LucideIcon;
}) {
  const status = useFormStatus();
  const mine = status.pending && status.data?.get("role") === role;
  const Icon = ROLE_ICONS[role];
  return (
    <button
      name="role"
      value={role}
      disabled={status.pending}
      data-testid={`demo-enter-${role}`}
      className="group flex w-full items-center gap-4 rounded-2xl p-4 text-start ring-1 ring-zinc-200 transition hover:bg-[#f6f5f2] hover:ring-ink disabled:opacity-60"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sand-100 text-ink">
        <Icon aria-hidden className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{mine ? pending : title}</span>
        <span className="mt-0.5 block text-sm leading-snug text-zinc-500">{body}</span>
      </span>
      {mine ? (
        <Loader2 aria-hidden className="size-5 shrink-0 animate-spin" />
      ) : (
        <Arrow aria-hidden className="size-5 shrink-0 text-zinc-400 transition group-hover:text-ink" />
      )}
    </button>
  );
}

/** A small, static picture of the workspace that follows the visitor's name and colours. */
function AppPreview({ name, t }: { name: string; t: DemoDict["preview"] }) {
  const nav: [LucideIcon, string][] = [
    [LayoutDashboard, t.dashboard],
    [FolderKanban, t.projects],
    [CheckSquare, t.tasks],
    [BadgeCheck, t.approvals],
    [MessagesSquare, t.chat],
    [BarChart3, t.reports],
  ];
  return (
    <div aria-hidden className="overflow-hidden rounded-[22px] bg-white shadow-[0_30px_80px_-30px_rgba(0,0,0,0.35)] ring-1 ring-zinc-900/10">
      <div className="flex min-h-[380px]">
        <div className="hidden w-44 shrink-0 flex-col gap-1 bg-ink p-3 text-[13px] sm:flex">
          <div className="mb-3 flex items-center gap-2 px-1 py-1">
            <Monogram name={name} className="size-7 text-xs" />
            <span className="truncate font-semibold text-white">{name}</span>
          </div>
          {nav.map(([Icon, label], i) => (
            <span
              key={label}
              className={cn("relative flex items-center gap-2 rounded-lg px-2.5 py-1.5", i === 0 ? "bg-white/10 text-white" : "text-zinc-400")}
            >
              {i === 0 && <span className="absolute inset-y-1.5 start-0 w-0.5 rounded-full bg-sand-300" />}
              <Icon className={cn("size-3.5", i === 0 && "text-sand-300")} />
              {label}
            </span>
          ))}
        </div>
        <div className="min-w-0 flex-1 bg-[#f6f5f2] p-5">
          <div className="flex items-center gap-2 sm:hidden">
            <Monogram name={name} className="size-7 text-xs" />
            <span className="truncate text-sm font-semibold">{name}</span>
          </div>
          <div className="mt-3 text-lg font-semibold sm:mt-0">{t.greeting}</div>
          <div className="mt-4 grid grid-cols-3 gap-2.5">
            {[
              [t.active, "12"],
              [t.waiting, "4"],
              [t.due, "9"],
            ].map(([label, n]) => (
              <div key={label} className="rounded-xl bg-white p-3 ring-1 ring-zinc-200/70">
                <div className="text-xl font-semibold tabular-nums">{n}</div>
                <div className="mt-0.5 truncate text-[11px] text-zinc-500">{label}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-xl bg-white p-4 ring-1 ring-zinc-200/70">
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate text-sm font-semibold">{t.project}</span>
              <span className="shrink-0 text-[11px] text-zinc-500">{t.client}</span>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-1.5">
              {t.stages.map((s, i) => (
                <div key={s}>
                  <div className={cn("h-1.5 rounded-full", i < 2 ? "bg-ink" : i === 2 ? "bg-sand-300" : "bg-zinc-200")} />
                  <div className={cn("mt-1.5 truncate text-[10px]", i === 2 ? "font-semibold text-ink" : "text-zinc-500")}>{s}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <span className="rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-white">{t.approve}</span>
              <span className="rounded-lg px-3 py-1.5 text-xs font-medium ring-1 ring-zinc-200">{t.changes}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
