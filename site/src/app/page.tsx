import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/button";
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
import { THEMES } from "@/content/features";
import { FACTS, PILLARS, THREAD_VS_OPERRA } from "@/content/home";
import { AUDIENCES } from "@/content/roles";
import { SOLUTIONS } from "@/content/solutions";
import { WORKFLOW } from "@/content/workflow";
import { pageMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";

export const metadata = {
  ...pageMetadata({ title: site.descriptor, description: site.description, path: "/" }),
  title: { absolute: `${site.name} — ${site.descriptor}` },
};

const theme = (id: string) => THEMES.find((t) => t.id === id)!;

/* One job in motion: everything up to review is done, the approval is live, delivery is next. */
const JOB = WORKFLOW.map((s) => ({
  label: s.label,
  state: s.id === "approval" ? ("live" as const) : s.id === "delivery" ? ("draft" as const) : ("done" as const),
}));

const label = "font-mono text-[11px] leading-4 font-medium tracking-[0.08em] uppercase";

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

      {/* Hero: tagline → descriptor → subline, then the real product at 1:1. */}
      <section aria-labelledby="hero-title" className="bg-paper">
        <Container className="pt-14 sm:pt-20">
          <p className={`flex items-center gap-2 text-muted ${label}`}>
            <StatusDot state="live" />
            {site.descriptor}
          </p>
          <h1
            id="hero-title"
            className="mt-6 max-w-4xl text-[44px] leading-[46px] font-semibold tracking-[-0.035em] sm:text-[64px] sm:leading-[64px]"
          >
            {site.tagline}
          </h1>
          <p className="mt-3 text-[20px] leading-8 text-muted sm:text-[22px]">
            <span lang="ar" dir="rtl">
              {site.taglineAr}
            </span>
          </p>
          <p className="mt-6 max-w-xl text-[18px] leading-[28px] text-muted">
            Run the whole agency in one place — from brief to client sign‑off.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/start" size="lg" arrow>
              Start free trial
            </ButtonLink>
            <ButtonLink href="/demo" size="lg" variant="secondary">
              Explore the product
            </ButtonLink>
          </div>
          <div className="mt-12 sm:mt-16">
            <HeroShot />
          </div>
        </Container>
      </section>

      {/* 01 — Out of the thread: name the real mess */}
      <Section tone="surface" labelledBy="thread-title">
        <Container>
          <SectionHeader
            id="thread-title"
            marker="Out of the thread"
            index={1}
            title="Your agency runs on WhatsApp. It shouldn’t"
            lead="The work gets done. The operation is invisible. Operra is where the agency actually runs."
          />
          <table className="mt-10 w-full border-collapse text-start text-[15px] leading-[22px]">
            <caption className="sr-only">How common agency moments move from the chat into Operra</caption>
            <thead className="max-sm:sr-only">
              <tr className="border-b border-line-strong">
                <th scope="col" className={`w-1/2 py-3 pe-6 text-start text-muted ${label}`}>
                  The thread
                </th>
                <th scope="col" className={`w-1/2 py-3 text-start text-ink ${label}`}>
                  In Operra
                </th>
              </tr>
            </thead>
            <tbody>
              {THREAD_VS_OPERRA.map((r) => (
                <tr key={r.thread} className="border-b border-line align-top max-sm:block max-sm:py-3">
                  <td className="py-3.5 pe-6 text-muted max-sm:block max-sm:p-0">{r.thread}</td>
                  <td className="py-3.5 font-medium max-sm:mt-1 max-sm:block max-sm:p-0 max-sm:before:content-['→_']">{r.operra}</td>
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
            marker="How work moves"
            index={2}
            title="From client brief to approved delivery, on one path"
            lead="Every job follows the same chain. Step through it — each step is a real screen from the product."
          />
          <div className="mt-10 rounded-lg border border-line bg-surface p-5 sm:p-6">
            <p className={`mb-5 text-muted ${label}`}>One job, in motion</p>
            <Schematic nodes={JOB} label="A job at the approval stage" />
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
            marker="Why it holds"
            index={3}
            title="Built for how agencies actually work"
            lead="Generic tools make you bend them into shape. Operra already knows clients, projects, stages and sign‑off."
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
              <figcaption className={`mb-3 text-on-panel-muted ${label}`}>Your team sends it</figcaption>
              <ProductFrame shot="cropRequestApproval" variant="card" sizes="(min-width: 1024px) 570px, 100vw" />
            </figure>
            <figure>
              <figcaption className={`mb-3 text-on-panel-muted ${label}`}>Your client decides</figcaption>
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
            marker="Built around agency work"
            index={4}
            title="Less chasing, more visibility"
            lead="Operra is opinionated about what agencies lose time on: repeating workflows, knowing who owns what, and seeing trouble early."
          />
          <div className="mt-16 space-y-20 sm:space-y-28">
            <FeatureRow theme={theme("workflows")} />
            <FeatureRow theme={theme("visibility")} flip />
            <FeatureRow theme={theme("communication")} />
          </div>
          <div className="mt-16 flex">
            <Link href="/features" className="group inline-flex items-center gap-1.5 py-2 text-[14px] font-medium">
              All features
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          </div>
        </Container>
      </Section>

      {/* 05 — Every seat (brand audiences → product roles) */}
      <Section labelledBy="roles-title">
        <Container>
          <SectionHeader
            id="roles-title"
            marker="Every seat in the agency"
            index={5}
            title="One workspace, the right view for each person"
            lead="Three roles, enforced by one permission system. Clients never see anything internal."
          />
          <ul className="mt-12 grid gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-2 lg:grid-cols-4">
            {AUDIENCES.map((a) => (
              <li key={a.id} className="flex flex-col bg-surface p-6">
                <p className={`text-muted ${label}`}>{a.audience}</p>
                <h3 className="mt-3 text-[18px] leading-[26px] font-semibold tracking-[-0.01em]">{a.who}</h3>
                <p className="mt-1.5 text-[14px] leading-5 text-muted">{a.wants}</p>
                <p className="mt-5 inline-flex w-fit items-center gap-1.5 rounded-xs border border-line px-2 py-0.5 text-[12px] leading-[18px]">
                  <span className="text-muted">Role</span>
                  <span className="font-medium">{a.productRole}</span>
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <ButtonLink href="/product#roles" variant="secondary" arrow>
              What each role can do
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
              marker="Your workspace"
              index={6}
              title="Your name on it, your data on its own"
              lead="Every agency gets a dedicated workspace and database, on its own domain, with its own logo and colours. Clients sign in to your brand — in Arabic or English."
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
            marker="Solutions"
            index={7}
            title="Starts with workflows agencies already run"
            lead="Every workspace comes with starter modules you can edit or replace."
          />
          <ul className="mt-12 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {SOLUTIONS.map((s) => (
              <li key={s.slug} className="bg-surface">
                <Link href={`/solutions/${s.slug}`} className="group flex h-full flex-col p-6 transition-colors hover:bg-paper">
                  <Icon name={s.icon} className="size-5 text-ink" />
                  <h3 className="mt-4 text-[15px] leading-[22px] font-semibold">{s.name}</h3>
                  <p className="mt-1.5 flex-1 text-[14px] leading-5 text-muted">{s.summary}</p>
                  <span className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-medium">
                    See the workflow
                    <ArrowRight aria-hidden className="size-4" />
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
