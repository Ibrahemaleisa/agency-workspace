import { ArrowRight } from "lucide-react";
import { CtaBand } from "@/components/cta-band";
import { Icon } from "@/components/icon";
import { PageHero } from "@/components/page-hero";
import { Container, Section } from "@/components/section";
import { StageChain } from "@/components/stage-chain";
import { LocalLink } from "@/components/local-link";
import { getContent } from "@/i18n/server";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata() {
  const { PAGES, locale } = await getContent();
  return pageMetadata({ title: PAGES.solutions.metaTitle, description: PAGES.solutions.metaDescription, path: "/solutions", locale });
}

export default async function SolutionsPage() {
  const { PAGES, SOLUTIONS } = await getContent();
  const t = PAGES.solutions;
  return (
    <>
      <PageHero
        marker={t.marker}
        title={t.title}
        lead={t.lead}
      />
      <Section tone="surface">
        <Container>
          <ul className="grid gap-px overflow-hidden rounded-lg border border-line bg-line lg:grid-cols-2">
            {SOLUTIONS.map((s, i) => (
              <li key={s.slug} className="bg-surface">
                <LocalLink href={`/solutions/${s.slug}`} className="group flex h-full flex-col p-6 transition-colors hover:bg-paper sm:p-8">
                  <p className="flex items-center gap-2 font-mono text-[11px] leading-4 font-medium tracking-[0.08em] text-muted uppercase">
                    <Icon name={s.icon} className="size-4 text-ink" />
                    {String(i + 1).padStart(2, "0")} — <bdi>{s.module.name}</bdi> {t.moduleSuffix}
                  </p>
                  <h2 className="mt-4 text-[24px] leading-[30px] font-semibold tracking-[-0.015em]">{s.name}</h2>
                  <p className="mt-2 text-[15px] leading-[22px] text-muted">{s.summary}</p>
                  <div className="mt-6 border-t border-line pt-6">
                    <StageChain stages={s.module.stages} size="sm" />
                  </div>
                  <span className="mt-8 inline-flex items-center gap-1.5 text-[14px] font-medium">
                    {t.howItRuns}
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
