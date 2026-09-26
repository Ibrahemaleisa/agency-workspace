import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/button";
import { CtaBand } from "@/components/cta-band";
import { Icon } from "@/components/icon";
import { PageHero } from "@/components/page-hero";
import { ProductFrame } from "@/components/product-frame";
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

const label = "font-mono text-[11px] leading-4 font-medium tracking-[0.08em] uppercase";

export default async function SolutionPage({ params }: PageProps<"/solutions/[slug]">) {
  const s = solutionBySlug((await params).slug);
  if (!s) notFound();
  const others = SOLUTIONS.filter((o) => o.slug !== s.slug);

  return (
    <>
      <nav aria-label="Breadcrumb" className="bg-paper">
        <Container className={`pt-6 text-muted ${label}`}>
          <Link href="/solutions" className="hover:text-ink">
            Solutions
          </Link>
          <span aria-hidden className="mx-2">
            /
          </span>
          <span aria-current="page" className="text-ink">
            {s.name}
          </span>
        </Container>
      </nav>
      <PageHero marker={s.name} title={s.headline} lead={s.intro}>
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/start" size="lg" arrow>
            Start free trial
          </ButtonLink>
          <ButtonLink href="/demo" size="lg" variant="secondary">
            See the demo
          </ButtonLink>
        </div>
      </PageHero>

      <Section tone="surface" labelledBy="module-title">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
            <div>
              <SectionHeader
                id="module-title"
                marker="Starter module"
                index={1}
                title={`The ${s.module.name} workflow`}
                lead="Included in every workspace. Add it to a project and Operra creates one task per stage; approval stages go to the client automatically."
              />
              <div className="mt-8">
                <StageChain stages={s.module.stages} />
              </div>
              <h3 className={`mt-10 text-muted ${label}`}>Fields on the module</h3>
              <ul className="mt-3 divide-y divide-line border-y border-line">
                {s.module.fields.map((f) => (
                  <li key={f} className="py-2.5 text-[14px] leading-5">
                    {f}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[13px] leading-[18px] text-muted">Rename stages, add fields or build new modules in Module Templates.</p>
            </div>
            <div className="min-w-0 lg:pt-10">
              <ProductFrame shot={s.shot} sizes="(min-width: 1200px) 680px, (min-width: 1024px) 58vw, 100vw" />
            </div>
          </div>
        </Container>
      </Section>

      <Section labelledBy="runs-title">
        <Container>
          <SectionHeader id="runs-title" marker="In practice" index={2} title="How it runs day to day" />
          <ol className="mt-12 grid gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-3">
            {s.howItRuns.map((h, i) => (
              <li key={h.title} className="bg-surface p-6">
                <p className={`text-muted ${label}`}>{String(i + 1).padStart(2, "0")}</p>
                <h3 className="mt-3 text-[18px] leading-[26px] font-semibold tracking-[-0.01em]">{h.title}</h3>
                <p className="mt-1.5 text-[14px] leading-5 text-muted">{h.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section tone="surface" labelledBy="others-title">
        <Container>
          <h2 id="others-title" className={`text-muted ${label}`}>
            Other agency types
          </h2>
          <ul className="mt-6 grid gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-3">
            {others.map((o) => (
              <li key={o.slug} className="bg-surface">
                <Link href={`/solutions/${o.slug}`} className="group flex h-full items-start gap-4 p-5 transition-colors hover:bg-paper">
                  <Icon name={o.icon} className="mt-0.5 size-5 shrink-0 text-ink" />
                  <span className="flex-1">
                    <span className="block text-[15px] leading-[22px] font-semibold">{o.name}</span>
                    <span className="mt-1 block text-[14px] leading-5 text-muted">{o.summary}</span>
                  </span>
                  <ArrowRight aria-hidden className="mt-1 size-4 shrink-0 text-muted" />
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
