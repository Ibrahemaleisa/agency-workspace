import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/button";
import { CtaBand } from "@/components/cta-band";
import { Icon } from "@/components/icon";
import { PageHero } from "@/components/page-hero";
import { ProductFrame } from "@/components/product-frame";
import { Reveal } from "@/components/reveal";
import { Container, Section, SectionHeader } from "@/components/section";
import { StageChain } from "@/components/stage-chain";
import { SOLUTIONS, solutionBySlug } from "@/content/solutions";
import { pageMetadata } from "@/lib/metadata";

export const dynamicParams = false;

export function generateStaticParams() {
  return SOLUTIONS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/solutions/[slug]">) {
  const s = solutionBySlug((await params).slug);
  if (!s) return {};
  return pageMetadata({ title: `Operra for ${s.name.toLowerCase()}`, description: s.summary, path: `/solutions/${s.slug}` });
}

export default async function SolutionPage({ params }: PageProps<"/solutions/[slug]">) {
  const s = solutionBySlug((await params).slug);
  if (!s) notFound();
  const others = SOLUTIONS.filter((o) => o.slug !== s.slug);

  return (
    <>
      <nav aria-label="Breadcrumb" className="bg-paper">
        <Container className="pt-8 text-sm text-muted">
          <Link href="/solutions" className="hover:text-ink">
            Solutions
          </Link>
          <span aria-hidden className="mx-2 text-subtle">
            /
          </span>
          <span aria-current="page" className="text-ink">
            {s.name}
          </span>
        </Container>
      </nav>
      <PageHero eyebrow={s.name} title={s.headline} lead={s.intro}>
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/start" size="lg" arrow>
            Start free trial
          </ButtonLink>
          <ButtonLink href="/demo" size="lg" variant="secondary">
            See the demo
          </ButtonLink>
        </div>
      </PageHero>

      <Section tone="white" labelledBy="module-title">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
            <div>
              <SectionHeader
                id="module-title"
                eyebrow="Starter module"
                title={`The ${s.module.name} workflow`}
                lead="Included in every workspace. Add it to a project and Operra creates one task per stage — stages marked for approval go to the client automatically."
              />
              <div className="mt-8">
                <StageChain stages={s.module.stages} />
              </div>
              <h3 className="mt-10 text-sm font-medium">Fields on the module</h3>
              <ul className="mt-3 space-y-2 text-[0.95rem] text-muted">
                {s.module.fields.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span aria-hidden className="text-subtle">
                      —
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm text-subtle">Rename stages, add fields or build new modules in Module Templates.</p>
            </div>
            <Reveal className="min-w-0 lg:pt-10">
              <ProductFrame shot={s.shot} sizes="(min-width: 1200px) 680px, (min-width: 1024px) 58vw, 100vw" />
            </Reveal>
          </div>
        </Container>
      </Section>

      <Section labelledBy="runs-title">
        <Container>
          <SectionHeader id="runs-title" eyebrow="In practice" title="How it runs day to day." />
          <ol className="mt-12 grid gap-4 md:grid-cols-3">
            {s.howItRuns.map((h, i) => (
              <li key={h.title} className="rounded-[var(--radius-frame)] border border-line bg-surface p-7">
                <span className="grid size-8 place-items-center rounded-full bg-ink text-sm font-medium text-sand tabular-nums">
                  {i + 1}
                </span>
                <h3 className="mt-5 text-lg font-medium tracking-tight">{h.title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{h.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section tone="white" labelledBy="others-title" className="border-t border-line">
        <Container>
          <h2 id="others-title" className="text-xl font-semibold tracking-tight">
            Other agency types
          </h2>
          <ul className="mt-6 grid gap-4 md:grid-cols-3">
            {others.map((o) => (
              <li key={o.slug}>
                <Link
                  href={`/solutions/${o.slug}`}
                  className="group flex h-full items-start gap-4 rounded-[var(--radius-frame)] border border-line bg-paper p-5 transition-colors hover:border-ink/20"
                >
                  <Icon name={o.icon} className="mt-0.5 size-5 shrink-0 text-sand-deep" />
                  <span className="flex-1">
                    <span className="block font-medium">{o.name}</span>
                    <span className="mt-1 block text-sm text-muted">{o.summary}</span>
                  </span>
                  <ArrowRight aria-hidden className="mt-1 size-4 shrink-0 text-subtle transition-transform group-hover:translate-x-0.5" />
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
