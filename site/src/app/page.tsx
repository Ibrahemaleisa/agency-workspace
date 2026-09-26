import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/button";
import { CtaBand } from "@/components/cta-band";
import { FeatureRow } from "@/components/feature-row";
import { FlowStrip } from "@/components/flow-strip";
import { Icon } from "@/components/icon";
import { PlatformGrid } from "@/components/platform-grid";
import { HeroShot } from "@/components/hero-shot";
import { ProductFrame } from "@/components/product-frame";
import { Reveal } from "@/components/reveal";
import { Container, Section, SectionHeader } from "@/components/section";
import { WorkflowSection } from "@/components/workflow-section";
import { THEMES } from "@/content/features";
import { SOLUTIONS } from "@/content/solutions";
import { pageMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";

export const metadata = {
  ...pageMetadata({ title: site.tagline, description: site.description, path: "/" }),
  title: { absolute: `${site.name} — ${site.tagline}` },
};

const theme = (id: string) => THEMES.find((t) => t.id === id)!;

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: site.name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: site.description,
    url: site.url,
    inLanguage: ["en", "ar"],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      {/* Hero */}
      <section aria-labelledby="hero-title" className="relative overflow-hidden bg-ink text-white">
        <div aria-hidden className="grid-lines absolute inset-0" />
        <Container className="relative pt-16 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3 py-1 text-[0.8rem] text-white/70">
              <span aria-hidden className="size-1.5 rounded-full bg-sand" />
              For creative, content and marketing agencies
            </p>
            <h1
              id="hero-title"
              className="mt-6 text-[2.6rem] leading-[1.02] font-semibold tracking-[-0.045em] sm:text-6xl lg:text-[4.5rem]"
            >
              The operating system for modern agencies.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/65 sm:text-xl">
              Clients, projects, reusable workflows, tasks, client approvals and chat — in one workspace that carries your
              agency’s name.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink href="/start" variant="light" size="lg" arrow>
                Start free trial
              </ButtonLink>
              <ButtonLink href="/demo" variant="ghost-light" size="lg">
                Explore the product
              </ButtonLink>
            </div>
            <FlowStrip tone="dark" className="mt-12 justify-center" />
          </div>

          <div className="relative mx-auto mt-14 max-w-[1140px] translate-y-px sm:mt-16">
            <HeroShot />
          </div>
        </Container>
      </section>

      {/* Workflow */}
      <Section tone="white" labelledBy="workflow-title" className="border-t border-line">
        <Container>
          <SectionHeader
            id="workflow-title"
            eyebrow="How work moves"
            title="From client brief to approved delivery, on one path."
            lead="Every job in your agency follows the same chain. Click through it — each step is a real screen from the product."
          />
          <div className="mt-12">
            <WorkflowSection />
          </div>
        </Container>
      </Section>

      {/* Approvals, both sides */}
      <Section labelledBy="approvals-title">
        <Container>
          <SectionHeader
            id="approvals-title"
            eyebrow="Approvals"
            title="Both sides of a sign‑off, in the same system."
            lead="Your team sends the work with the files the client should see. The client approves or asks for changes — and the decision lands back on the task."
          />
          <Reveal className="mt-12 grid gap-6 lg:grid-cols-2">
            <div>
              <p className="mb-3 text-sm font-medium text-muted">Your team</p>
              <ProductFrame shot="cropRequestApproval" variant="card" sizes="(min-width: 1024px) 570px, 100vw" />
            </div>
            <div>
              <p className="mb-3 text-sm font-medium text-muted">Your client</p>
              <ProductFrame shot="cropClientApprove" variant="card" sizes="(min-width: 1024px) 570px, 100vw" />
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* Deep themes */}
      <Section tone="white" labelledBy="themes-title" className="border-y border-line">
        <Container>
          <SectionHeader
            id="themes-title"
            eyebrow="Built around agency work"
            title="Less chasing. More visibility."
            lead="Operra is opinionated about the things agencies lose time on: repeating workflows, knowing who owns what, and seeing trouble early."
          />
          <div className="mt-16 space-y-24 sm:space-y-32">
            <FeatureRow theme={theme("workflows")} />
            <FeatureRow theme={theme("visibility")} flip />
            <FeatureRow theme={theme("communication")} />
          </div>
        </Container>
      </Section>

      {/* All themes */}
      <Section labelledBy="all-title">
        <Container>
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <SectionHeader id="all-title" eyebrow="One place for agency operations" title="Everything your agency runs on." />
            <Link href="/features" className="group inline-flex items-center gap-1.5 py-2 text-sm font-medium text-ink">
              All features
              <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <ul className="mt-12 grid gap-px overflow-hidden rounded-[var(--radius-frame)] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {THEMES.map((t) => (
              <li key={t.id} className="bg-surface">
                <Link href={`/features#${t.id}`} className="group block h-full p-6 transition-colors hover:bg-paper">
                  <Icon name={t.icon} className="size-5 text-sand-deep" />
                  <h3 className="mt-4 font-medium">{t.eyebrow}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{t.body}</p>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* Brand + language */}
      <Section tone="dark" labelledBy="brand-title">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
            <SectionHeader
              id="brand-title"
              tone="dark"
              eyebrow="Your workspace"
              title="Your name on it. Your data on its own."
              lead="Each agency gets a dedicated workspace and database, on its own domain, with its own logo and colours. Clients sign in to your brand — in Arabic or English."
            />
            <Reveal>
              <ProductFrame shot="dashboardAr" tone="dark" sizes="(min-width: 1200px) 680px, (min-width: 1024px) 58vw, 100vw" />
            </Reveal>
          </div>
          <div className="mt-16">
            <PlatformGrid tone="dark" />
          </div>
        </Container>
      </Section>

      {/* Solutions */}
      <Section tone="white" labelledBy="solutions-title">
        <Container>
          <SectionHeader
            id="solutions-title"
            eyebrow="Solutions"
            title="Starts with workflows agencies already use."
            lead="Every workspace comes with starter modules you can edit or replace."
          />
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SOLUTIONS.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/solutions/${s.slug}`}
                  className="group flex h-full flex-col rounded-[var(--radius-frame)] border border-line bg-paper p-6 transition-colors hover:border-ink/20"
                >
                  <Icon name={s.icon} className="size-5 text-sand-deep" />
                  <h3 className="mt-4 font-medium">{s.name}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{s.summary}</p>
                  <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium">
                    See the workflow
                    <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <CtaBand />
    </>
  );
}
