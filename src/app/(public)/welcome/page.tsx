import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  Clapperboard,
  Handshake,
  Mail,
  Megaphone,
  MessageCircle,
  PenTool,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getDict } from "@/lib/lang";
import { isPlatform } from "@/lib/platform";
import { BrandLogo, BrandMark } from "@/components/site/brand";
import { Reveal } from "@/components/site/reveal";
import { LeadForm } from "@/components/site/lead-form";
import { cn } from "@/components/ui";
import { LangSwitch } from "@/components/site/lang-switch";

export async function generateMetadata(): Promise<Metadata> {
  const { lang, t, brand } = await getDict();
  return {
    title: { absolute: `${brand.name[lang]} · ${t.footer.tagline}` },
    description: t.hero.sub,
  };
}

const SERVICE_ICONS = { content: PenTool, production: Clapperboard, paid: Megaphone, account: Handshake } as const;

export default async function LandingPage() {
  const [{ lang, t, brand }, user] = await Promise.all([getDict(), getCurrentUser()]);
  // The agency can switch the public landing page off; visitors then go straight to sign-in.
  // On the platform's own host (no agency), visitors belong on the Operra marketing site.
  if (!brand.showLanding) {
    if (user) redirect("/");
    redirect((isPlatform() && !brand.orgId && process.env.MARKETING_URL) || "/login");
  }
  if (!brand.orgId) redirect("/setup");
  const brandName = brand.name[lang];
  const social = Object.entries(brand.social).filter(([, url]) => url);
  const portalHref = user ? "/" : "/login";
  const portalLabel = user ? t.nav.dashboard : t.nav.login;
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;

  return (
    <div className="relative overflow-x-clip">
      {/* ---------------- Header ---------------- */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/5 bg-ink/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 md:h-20 md:px-8">
          <Link href={user ? "/welcome" : "/"} aria-label={brandName}>
            <BrandLogo logo={brand.logo} name={brandName} />
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-zinc-400 lg:flex">
            {(["services", "journey", "portal", "clients", "contact"] as const)
              .filter((id) => id !== "clients" || brand.showcaseClients.length > 0)
              .map((id) => (
              <a key={id} href={`#${id}`} className="transition hover:text-white">
                {t.nav[id]}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <LangSwitch lang={lang} next={user ? "/welcome" : "/"} />
            <Link
              href={portalHref}
              className="rounded-full bg-sand-200 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-sand-100"
            >
              {portalLabel}
            </Link>
          </div>
        </div>
      </header>

      {/* ---------------- Hero ---------------- */}
      <section className="relative flex min-h-[100svh] items-center overflow-hidden pt-24 pb-16">
        <div className="starfield starfield-slow pointer-events-none absolute inset-0 opacity-70" />
        <div className="pointer-events-none absolute top-1/4 -end-40 size-[640px] rounded-full bg-sand-200/[0.07] blur-[140px]" />
        <div className="pointer-events-none absolute -bottom-40 -start-20 size-[520px] rounded-full bg-white/[0.04] blur-[120px]" />
        <span className="animate-meteor pointer-events-none absolute top-24 end-[10%] h-px w-40 bg-gradient-to-l from-transparent via-sand-200 to-transparent" />

        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-5 md:px-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-sand-200 md:text-sm">
                <span className="size-1.5 rounded-full bg-sand-200 shadow-[0_0_12px_#e8dcc8]" />
                {t.hero.eyebrow}
              </span>
            </Reveal>
            <Reveal delay={100}>
              <h1 className="font-display mt-6 text-5xl leading-[1.15] font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
                {t.hero.title1}
                <br />
                <span className="bg-gradient-to-r from-sand-100 via-sand-200 to-sand-400 bg-clip-text text-transparent">
                  {t.hero.title2}
                </span>
              </h1>
            </Reveal>
            <Reveal delay={200}>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-zinc-400 md:text-lg">{t.hero.sub}</p>
            </Reveal>
            <Reveal delay={300}>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#contact"
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-sand-200 px-7 py-3.5 font-semibold text-ink shadow-xl shadow-sand-200/10 transition hover:bg-sand-100"
                >
                  {t.hero.primary}
                  <Arrow className="size-4 transition group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                </a>
                <Link
                  href={portalHref}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-3.5 font-medium text-white backdrop-blur transition hover:border-white/30 hover:bg-white/10"
                >
                  {user ? t.nav.dashboard : t.hero.secondary}
                </Link>
              </div>
            </Reveal>
          </div>

          {/* Mask in orbit */}
          <div className="relative mx-auto aspect-square w-full max-w-sm sm:max-w-md lg:max-w-none" aria-hidden="true">
            <div className="animate-orbit absolute inset-[6%] rounded-full border border-white/10">
              <span className="absolute top-1/2 -start-1.5 size-3 rounded-full bg-sand-200 shadow-[0_0_20px_4px_rgba(232,220,200,0.45)]" />
            </div>
            <div className="animate-orbit-fast absolute inset-[-4%] rounded-full border border-dashed border-white/[0.08] [animation-direction:reverse]">
              <span className="absolute -top-1 start-1/2 size-2 rounded-full bg-white shadow-[0_0_14px_3px_rgba(255,255,255,0.5)]" />
            </div>
            <div className="absolute inset-[22%] rounded-full bg-sand-200/[0.06] blur-2xl" />
            <div className="animate-float absolute inset-0 flex items-center justify-center">
              <BrandMark logo={brand.logo} name={brandName} className="h-[42%] drop-shadow-[0_30px_60px_rgb(0_0_0/0.35)]" textClass="text-7xl md:text-8xl" />
            </div>
          </div>
        </div>

        <a href="#about" className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-xs text-zinc-500 md:flex">
          {t.hero.scroll}
          <span className="h-10 w-px bg-gradient-to-b from-zinc-500 to-transparent" />
        </a>
      </section>

      {/* ---------------- About ---------------- */}
      <section id="about" className="relative scroll-mt-20 py-24 md:py-36">
        <div className="mx-auto max-w-5xl px-5 md:px-8">
          <Reveal>
            <SectionLabel>{t.about.label}</SectionLabel>
            <h2 className="font-display mt-5 text-3xl leading-snug font-semibold text-white md:text-5xl md:leading-tight">
              {t.about.title}
            </h2>
          </Reveal>
          <Reveal delay={150}>
            <p className="mt-8 max-w-3xl text-lg leading-relaxed text-zinc-400 md:text-xl">{t.about.body}</p>
          </Reveal>
        </div>
      </section>

      {/* ---------------- Meteor vs Orbit ---------------- */}
      <section className="relative py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <Reveal className="text-center">
            <SectionLabel center>{t.contrast.label}</SectionLabel>
            <h2 className="font-display mt-5 text-3xl font-semibold text-white md:text-5xl">{t.contrast.title}</h2>
          </Reveal>
          <div className="mt-14 grid gap-5 md:grid-cols-2">
            <Reveal>
              <div className="relative h-full overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] p-8 md:p-10">
                <div className="relative h-40">
                  <span className="animate-meteor absolute top-4 end-4 h-0.5 w-48 bg-gradient-to-l from-transparent via-zinc-400 to-transparent" />
                  <span className="absolute top-10 end-24 size-1 rounded-full bg-zinc-600" />
                  <span className="absolute top-24 end-10 size-1 rounded-full bg-zinc-700" />
                </div>
                <h3 className="font-display text-2xl font-semibold text-zinc-300">{t.contrast.meteorTitle}</h3>
                <p className="mt-3 leading-relaxed text-zinc-500">{t.contrast.meteorText}</p>
              </div>
            </Reveal>
            <Reveal delay={150}>
              <div className="relative h-full overflow-hidden rounded-3xl border border-sand-200/20 bg-gradient-to-br from-sand-200/[0.08] via-sand-200/[0.03] to-transparent p-8 md:p-10">
                <div className="relative mx-auto h-40 w-40" aria-hidden="true">
                  <span className="absolute inset-[30%] rounded-full bg-sand-200 shadow-[0_0_40px_rgba(232,220,200,0.35)]" />
                  <span className="animate-orbit absolute inset-0 rounded-full border border-sand-200/30">
                    <span className="absolute top-1/2 -start-1 size-2 rounded-full bg-white shadow-[0_0_12px_#fff]" />
                  </span>
                </div>
                <h3 className="font-display text-2xl font-semibold text-white">{t.contrast.orbitTitle}</h3>
                <p className="mt-3 leading-relaxed text-zinc-300">{t.contrast.orbitText}</p>
              </div>
            </Reveal>
          </div>
          <Reveal className="mt-12 text-center">
            <p className="font-display bg-gradient-to-r from-sand-100 to-sand-400 bg-clip-text text-2xl font-semibold text-transparent md:text-3xl">
              {t.contrast.tagline}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ---------------- Services ---------------- */}
      <section id="services" className="relative scroll-mt-20 py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <Reveal>
            <SectionLabel>{t.services.label}</SectionLabel>
            <h2 className="font-display mt-5 max-w-2xl text-3xl font-semibold text-white md:text-5xl md:leading-tight">
              {t.services.title}
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {t.services.items.map((s, i) => {
              const Icon = SERVICE_ICONS[s.key as keyof typeof SERVICE_ICONS];
              return (
                <Reveal key={s.key} delay={i * 100}>
                  <div className="group relative h-full overflow-hidden rounded-3xl border border-white/5 bg-white/[0.03] p-7 transition duration-500 hover:-translate-y-1 hover:border-sand-200/30 hover:bg-white/[0.05]">
                    <div className="pointer-events-none absolute -top-16 -end-16 size-40 rounded-full bg-sand-200/0 blur-3xl transition duration-500 group-hover:bg-sand-200/10" />
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-sand-200/10 ring-1 ring-sand-200/20">
                      <Icon className="size-5 text-sand-200" />
                    </span>
                    <h3 className="font-display mt-6 text-xl font-semibold text-white">{s.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-zinc-400">{s.text}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------------- Journey ---------------- */}
      <section id="journey" className="relative scroll-mt-20 py-20 md:py-28">
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-96 -translate-y-1/2 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent" />
        <div className="relative mx-auto max-w-7xl px-5 md:px-8">
          <Reveal className="text-center">
            <SectionLabel center>{t.journey.label}</SectionLabel>
            <h2 className="font-display mt-5 text-3xl font-semibold text-white md:text-5xl">{t.journey.title}</h2>
          </Reveal>
          <ol className="relative mt-16 grid gap-6 md:grid-cols-5 md:gap-4">
            <span className="pointer-events-none absolute top-7 right-[10%] left-[10%] hidden h-px bg-gradient-to-r from-transparent via-sand-200/30 to-transparent md:block" />
            {t.journey.steps.map((step, i) => {
              const highlight = i === 3; // "Your approval" — the client's moment in the journey
              return (
                <li key={step.title}>
                  <Reveal delay={i * 120} className="relative flex gap-4 md:flex-col md:items-center md:text-center">
                    <span
                      className={cn(
                        "font-display relative z-10 flex size-14 shrink-0 items-center justify-center rounded-full border text-lg font-semibold",
                        highlight
                          ? "border-sand-200 bg-sand-200 text-ink shadow-[0_0_30px_rgba(232,220,200,0.35)]"
                          : "border-white/10 bg-ink text-sand-200",
                      )}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="font-display text-lg font-semibold text-white md:mt-5">{step.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-zinc-400">{step.text}</p>
                    </div>
                  </Reveal>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* ---------------- Portal showcase ---------------- */}
      <section id="portal" className="relative scroll-mt-20 py-20 md:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 md:px-8 lg:grid-cols-2">
          <Reveal>
            <SectionLabel>{t.portal.label}</SectionLabel>
            <h2 className="font-display mt-5 text-3xl font-semibold text-white md:text-5xl md:leading-tight">{t.portal.title}</h2>
            <p className="mt-6 text-lg leading-relaxed text-zinc-400">{t.portal.body}</p>
            <ul className="mt-8 space-y-4">
              {t.portal.features.map((f) => (
                <li key={f} className="flex items-center gap-3 text-zinc-200">
                  <span className="flex size-7 items-center justify-center rounded-full bg-sand-200/10 ring-1 ring-sand-200/30">
                    <Check className="size-4 text-sand-200" />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href={portalHref}
              className="group mt-10 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 font-semibold text-ink transition hover:bg-sand-100"
            >
              {user ? t.nav.dashboard : t.portal.cta}
              <Arrow className="size-4 transition group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
            </Link>
          </Reveal>
          <Reveal delay={150}>
            <PortalMock t={t.portal.mock} logo={brand.logo} name={brandName} />
          </Reveal>
        </div>
      </section>

      {/* ---------------- Clients ---------------- */}
      {brand.showcaseClients.length > 0 && (
      <section id="clients" className="relative scroll-mt-20 py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <Reveal className="text-center">
            <SectionLabel center>{t.clients.label}</SectionLabel>
            <h2 className="font-display mt-5 text-3xl font-semibold text-white md:text-4xl">{t.clients.title}</h2>
          </Reveal>
          <Reveal delay={100}>
            <div className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-white/5 bg-white/5 sm:grid-cols-3 lg:grid-cols-5">
              {brand.showcaseClients.map((c) => (
                <div key={c} className="flex h-28 items-center justify-center bg-ink px-4 text-center transition hover:bg-zinc-900">
                  <span className="font-display text-base font-semibold tracking-tight text-zinc-500 transition hover:text-sand-200" dir="ltr">
                    {c}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>
      )}

      {/* ---------------- Contact / CTA ---------------- */}
      <section id="contact" className="relative scroll-mt-20 py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="relative overflow-hidden rounded-[2rem] border border-sand-200/15 bg-gradient-to-br from-zinc-900 via-ink to-sand-950/60 p-6 md:p-14">
            <div className="starfield pointer-events-none absolute inset-0 opacity-40" />
            <div className="pointer-events-none absolute -top-32 -end-32 size-96 rounded-full bg-sand-200/10 blur-3xl" />
            <div className="relative grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
              <Reveal>
                <SectionLabel>{t.contact.label}</SectionLabel>
                <h2 className="font-display mt-5 text-4xl font-bold text-white md:text-6xl">{t.contact.title}</h2>
                <p className="mt-5 text-lg leading-relaxed text-zinc-300">{t.contact.body}</p>
                <div className="mt-8 space-y-3">
                  {brand.whatsapp && (
                    <a
                      href={`https://wa.me/${brand.whatsapp}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-sand-200 px-5 py-3 font-semibold text-ink transition hover:bg-sand-100"
                    >
                      <MessageCircle className="size-5" /> {t.contact.whatsapp}
                    </a>
                  )}
                  {brand.contactEmail && (
                    <p className="flex flex-wrap items-center gap-2 text-sm text-zinc-400">
                      <Mail className="size-4" /> {t.contact.orEmail}
                      <a href={`mailto:${brand.contactEmail}`} className="font-medium text-sand-200 hover:text-white" dir="ltr">
                        {brand.contactEmail}
                      </a>
                    </p>
                  )}
                </div>
              </Reveal>
              <Reveal delay={150}>
                <LeadForm t={t.contact} services={t.services.items} />
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Footer ---------------- */}
      <footer className="border-t border-white/5 py-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 md:flex-row md:items-center md:justify-between md:px-8">
          <div>
            <BrandLogo logo={brand.logo} name={brandName} />
            <p className="mt-3 text-sm text-zinc-500">{t.footer.tagline}</p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-400">
            {(["services", "journey", "portal", "contact"] as const).map((id) => (
              <a key={id} href={`#${id}`} className="hover:text-white">
                {t.nav[id]}
              </a>
            ))}
            <Link href={portalHref} className="hover:text-white">
              {portalLabel}
            </Link>
          </nav>
          <div className="flex items-center gap-4 text-sm text-zinc-500">
            {social.map(([name, url]) => (
                <a key={name} href={url} target="_blank" rel="noreferrer" className="capitalize hover:text-white">
                  {name}
                </a>
              ))}
            <span>
              © {new Date().getFullYear()} {brandName} · {t.footer.rights}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SectionLabel({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-3 text-sm font-medium tracking-wide text-sand-300", center && "justify-center")}>
      <span className="h-px w-8 bg-gradient-to-r from-sand-300 to-transparent rtl:bg-gradient-to-l" />
      {children}
    </span>
  );
}

/** Stylised preview of the client portal (pure HTML, no screenshot). */
function PortalMock({ t, logo, name }: { logo: string | null; name: string; t: { project: string; progress: string; awaiting: string; item: string; approve: string; changes: string; stages: string[] } }) {
  return (
    <div className="relative" aria-hidden="true">
      <div className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-sand-200/[0.08] blur-2xl" />
      <div className="relative rounded-3xl border border-white/10 bg-zinc-950/90 p-5 shadow-2xl backdrop-blur md:p-7">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandMark logo={logo} name={name} className="h-8" />
            <div>
              <div className="font-display font-semibold text-white">{t.project}</div>
              <div className="text-xs text-zinc-500">Bloom Café</div>
            </div>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-sand-200/10 px-2.5 py-1 text-xs font-medium text-sand-200">
            <span className="size-1.5 rounded-full bg-sand-200" /> Active
          </span>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex justify-between text-xs">
            <span className="text-zinc-400">{t.progress}</span>
            <span className="font-semibold text-white">68%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/5">
            <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-sand-400 to-sand-100 rtl:bg-gradient-to-l" />
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {t.stages.map((s, i) => (
              <div key={s} className="text-center">
                <div className={cn("h-1 rounded-full", i < 2 ? "bg-sand-200" : i === 2 ? "bg-white" : "bg-white/10")} />
                <div className={cn("mt-2 text-[11px]", i === 2 ? "font-semibold text-white" : "text-zinc-500")}>{s}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-sand-200/25 bg-sand-200/[0.06] p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-sand-200">
            <BadgeCheck className="size-4" /> {t.awaiting}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className="grid size-12 shrink-0 grid-cols-2 gap-0.5 overflow-hidden rounded-lg">
              <span className="bg-sand-300" />
              <span className="bg-zinc-300" />
              <span className="bg-zinc-500" />
              <span className="bg-sand-100" />
            </div>
            <div className="min-w-0 flex-1 text-sm font-medium text-white">{t.item}</div>
          </div>
          <div className="mt-4 flex gap-2">
            <span className="flex-1 rounded-xl bg-sand-200 py-2 text-center text-sm font-semibold text-ink">{t.approve}</span>
            <span className="flex-1 rounded-xl border border-white/10 py-2 text-center text-sm text-zinc-300">{t.changes}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
