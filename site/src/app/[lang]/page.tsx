import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/button";
import { CallSheet } from "@/components/call-sheet";
import { CtaBand } from "@/components/cta-band";
import { FeatureRow } from "@/components/feature-row";
import { HeroShot } from "@/components/hero-shot";
import { Icon } from "@/components/icon";
import { PlatformGrid } from "@/components/platform-grid";
import { ProductFrame } from "@/components/product-frame";
import { Schematic } from "@/components/schematic";
import { Container, Section, SectionHeader } from "@/components/section";
import { StatusDot } from "@/components/status-dot";
import { WorkflowSection } from "@/components/workflow-section";
import { LocalLink } from "@/components/local-link";
import { getContent, getLocale } from "@/i18n/server";
import { appLinks } from "@/lib/app-links";
import { pageMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";

export async function generateMetadata() {
  const locale = await getLocale();
  const ar = locale === "ar";
  const descriptor = ar ? site.descriptorAr : site.descriptor;
  return {
    ...pageMetadata({ title: descriptor, description: ar ? site.descriptionAr : site.description, path: "/", locale }),
    title: { absolute: `${site.name} — ${descriptor}` },
  };
}

const label = "text-[13px] leading-5 font-medium";

export default async function HomePage() {
  const { THEMES, FACTS, PILLARS, THREAD_VS_OPERRA, AUDIENCES, SOLUTIONS, WORKFLOW, PAGES, UI, locale } = await getContent();
  const t = PAGES.home;
  const ar = locale === "ar";
  const links = appLinks(locale);
  const theme = (id: string) => THEMES.find((x) => x.id === id)!;
  /* One job in motion: everything up to review is done, the approval is live, delivery is next. */
  const job = WORKFLOW.map((s) => ({
    label: s.label,
    state: s.id === "approval" ? ("live" as const) : s.id === "delivery" ? ("draft" as const) : ("done" as const),
  }));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: site.name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: ar ? site.descriptionAr : site.description,
    url: ar ? `${site.url}/ar` : site.url,
    inLanguage: ["en", "ar"],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      {/*
        Hero: the tagline with the kashida stroke stretching under it (the page's one moment of
        motion), the call sheet beside it, then the real product at 1:1.
      */}
      <section aria-labelledby="hero-title" className="bg-paper">
        <Container className="pt-14 sm:pt-20">
          <div className="grid items-end gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
            <div className="min-w-0">
              <p className={`flex items-center gap-2 text-muted ${label}`}>
                <StatusDot state="live" />
                {ar ? site.descriptorAr : site.descriptor}
              </p>
              <h1
                id="hero-title"
                className="mt-6 max-w-3xl text-[44px] leading-[48px] font-bold tracking-[-0.04em] sm:text-[68px] sm:leading-[70px]"
              >
                {/* In Arabic the kashida stretches the word for "moving" itself. */}
                {ar ? site.taglineAr.replace("يتحرك", "يتحـــرك") : site.tagline}
              </h1>
              <span aria-hidden className="mt-7 block h-2 w-full max-w-[560px] overflow-hidden rounded-full">
                <span className="kashida-bar h-full w-full rounded-full bg-signal" />
              </span>
              {/* The tagline in the other language, as in the bilingual lock-up. */}
              <p className="mt-6 text-[19px] leading-8 text-muted sm:text-[21px]">
                <span lang={ar ? "en" : "ar"} dir={ar ? "ltr" : "rtl"}>
                  {ar ? site.tagline : site.taglineAr}
                </span>
              </p>
              <p className="mt-4 max-w-xl text-[18px] leading-[28px] text-ink/80">{t.heroSub}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href={links.trial} size="lg" arrow>
                  {UI.startTrial}
                </ButtonLink>
                <ButtonLink href="/demo" size="lg" variant="secondary">
                  {UI.exploreProduct}
                </ButtonLink>
              </div>
            </div>
            <CallSheet className="min-w-0" />
          </div>
          <div className="mt-14 sm:mt-20">
            <HeroShot />
          </div>
        </Container>
      </section>

      {/* 01 — Out of the thread: name the real mess */}
      <Section tone="surface" labelledBy="thread-title">
        <Container>
          <SectionHeader
            id="thread-title"
            marker={t.thread.marker}
            index={1}
            title={t.thread.title}
            lead={t.thread.lead}
          />
          <table className="mt-10 w-full border-collapse text-start text-[15px] leading-[22px]">
            <caption className="sr-only">{t.thread.caption}</caption>
            <thead className="max-sm:sr-only">
              <tr className="border-b border-line-strong">
                <th scope="col" className={`w-1/2 py-3 pe-6 text-start text-muted ${label}`}>
                  {t.thread.colThread}
                </th>
                <th scope="col" className={`w-1/2 py-3 text-start text-ink ${label}`}>
                  {t.thread.colOperra}
                </th>
              </tr>
            </thead>
            <tbody>
              {THREAD_VS_OPERRA.map((r) => (
                <tr key={r.thread} className="border-b border-line align-top max-sm:block max-sm:py-3">
                  <td className="py-3.5 pe-6 text-muted max-sm:block max-sm:p-0">{r.thread}</td>
                  <td className="py-3.5 font-medium max-sm:mt-1 max-sm:block max-sm:p-0 max-sm:before:content-['→_'] rtl:max-sm:before:content-['←_']">{r.operra}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Container>
      </Section>

      {/* 02 — How work moves */}
      <Section labelledBy="workflow-title">
        <Container>
          <SectionHeader
            id="workflow-title"
            marker={t.workflow.marker}
            index={2}
            title={t.workflow.title}
            lead={t.workflow.lead}
          />
          <div className="mt-10 rounded-lg border border-line bg-surface p-5 sm:p-6">
            <p className={`mb-5 text-muted ${label}`}>{t.workflow.job}</p>
            <Schematic nodes={job} label={t.workflow.jobLabel} />
          </div>
          <div className="mt-14">
            <WorkflowSection />
          </div>
        </Container>
      </Section>

      {/* 03 — Proof, on a panel band */}
      <Section tone="panel" labelledBy="proof-title">
        <Container>
          <SectionHeader
            id="proof-title"
            onPanel
            marker={t.proof.marker}
            index={3}
            title={t.proof.title}
            lead={t.proof.lead}
          />
          <ul className="mt-12 grid gap-px overflow-hidden rounded-lg border border-line-panel bg-line-panel sm:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map((p) => (
              <li key={p.title} className="bg-panel p-6">
                <h3 className="text-[18px] leading-[26px] font-semibold tracking-[-0.01em]">{p.title}</h3>
                <p className="mt-2 text-[14px] leading-5 text-on-panel-muted">{p.body}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-line-panel pt-8 sm:grid-cols-5">
            {FACTS.map((f) => (
              <div key={f.label} className="flex flex-col-reverse gap-1">
                <dt className={`text-on-panel-muted ${label}`}>{f.label}</dt>
                <dd className="font-mono text-[32px] leading-[38px] font-medium">{f.value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            <figure>
              <figcaption className={`mb-3 text-on-panel-muted ${label}`}>{t.proof.teamSends}</figcaption>
              <ProductFrame shot="cropRequestApproval" variant="card" sizes="(min-width: 1024px) 570px, 100vw" />
            </figure>
            <figure>
              <figcaption className={`mb-3 text-on-panel-muted ${label}`}>{t.proof.clientDecides}</figcaption>
              <ProductFrame shot="cropClientApprove" variant="card" sizes="(min-width: 1024px) 570px, 100vw" />
            </figure>
          </div>
        </Container>
      </Section>

      {/* 04 — Deep themes */}
      <Section tone="surface" labelledBy="themes-title">
        <Container>
          <SectionHeader
            id="themes-title"
            marker={t.themes.marker}
            index={4}
            title={t.themes.title}
            lead={t.themes.lead}
          />
          <div className="mt-16 space-y-20 sm:space-y-28">
            <FeatureRow theme={theme("workflows")} />
            <FeatureRow theme={theme("visibility")} flip />
            <FeatureRow theme={theme("communication")} />
          </div>
          <div className="mt-16 flex">
            <LocalLink href="/features" className="group inline-flex items-center gap-1.5 py-2 text-[14px] font-medium">
              {t.themes.all}
              <ArrowRight aria-hidden className="size-4" />
            </LocalLink>
          </div>
        </Container>
      </Section>

      {/* 05 — Every seat (brand audiences → product roles) */}
      <Section labelledBy="roles-title">
        <Container>
          <SectionHeader
            id="roles-title"
            marker={t.roles.marker}
            index={5}
            title={t.roles.title}
            lead={t.roles.lead}
          />
          <ul className="mt-12 grid gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-2 lg:grid-cols-4">
            {AUDIENCES.map((a) => (
              <li key={a.id} className="flex flex-col bg-surface p-6">
                <p className={`text-muted ${label}`}>{a.audience}</p>
                <h3 className="mt-3 text-[18px] leading-[26px] font-semibold tracking-[-0.01em]">{a.who}</h3>
                <p className="mt-1.5 text-[14px] leading-5 text-muted">{a.wants}</p>
                <p className="mt-5 inline-flex w-fit items-center gap-1.5 rounded-xs border border-line px-2 py-0.5 text-[12px] leading-[18px]">
                  <span className="text-muted">{UI.role}</span>
                  <span className="font-medium">{a.productRole}</span>
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <ButtonLink href="/product#roles" variant="secondary" arrow>
              {t.roles.more}
            </ButtonLink>
          </div>
        </Container>
      </Section>

      {/* 06 — Your workspace */}
      <Section tone="surface" labelledBy="brand-title">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
            <SectionHeader
              id="brand-title"
              marker={t.brand.marker}
              index={6}
              title={t.brand.title}
              lead={t.brand.lead}
            />
            <ProductFrame shot="dashboardAr" sizes="(min-width: 1200px) 680px, (min-width: 1024px) 58vw, 100vw" />
          </div>
          <div className="mt-16">
            <PlatformGrid />
          </div>
        </Container>
      </Section>

      {/* 07 — Solutions */}
      <Section labelledBy="solutions-title">
        <Container>
          <SectionHeader
            id="solutions-title"
            marker={t.solutions.marker}
            index={7}
            title={t.solutions.title}
            lead={t.solutions.lead}
          />
          <ul className="mt-12 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {SOLUTIONS.map((s) => (
              <li key={s.slug} className="bg-surface">
                <LocalLink href={`/solutions/${s.slug}`} className="group flex h-full flex-col p-6 transition-colors hover:bg-paper">
                  <Icon name={s.icon} className="size-5 text-ink" />
                  <h3 className="mt-4 text-[15px] leading-[22px] font-semibold">{s.name}</h3>
                  <p className="mt-1.5 flex-1 text-[14px] leading-5 text-muted">{s.summary}</p>
                  <span className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-medium">
                    {t.solutions.see}
                    <ArrowRight aria-hidden className="size-4" />
                  </span>
                </LocalLink>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <CtaBand />
    </>
  );
}
