import { CtaBand } from "@/components/cta-band";
import { FaqList } from "@/components/faq";
import { FeatureRow } from "@/components/feature-row";
import { Icon } from "@/components/icon";
import { PageHero } from "@/components/page-hero";
import { PlatformGrid } from "@/components/platform-grid";
import { Container, Section, SectionHeader } from "@/components/section";
import { getContent } from "@/i18n/server";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata() {
  const { PAGES, locale } = await getContent();
  return pageMetadata({ title: PAGES.features.metaTitle, description: PAGES.features.metaDescription, path: "/features", locale });
}

export default async function FeaturesPage() {
  const { PAGES, THEMES, GENERAL_FAQ } = await getContent();
  const t = PAGES.features;
  return (
    <>
      <PageHero
        marker={t.marker}
        title={t.title}
        lead={t.lead}
      >
        <nav aria-label={t.jump}>
          <ul className="flex flex-wrap gap-2">
            {THEMES.map((t, i) => (
              <li key={t.id}>
                <a
                  href={`#${t.id}`}
                  className="inline-flex items-center gap-2 rounded-md border border-line-strong bg-surface px-3 py-1.5 text-[14px] transition-colors hover:bg-paper"
                >
                  <span className="font-mono text-[11px] text-muted">{String(i + 1).padStart(2, "0")}</span>
                  <Icon name={t.icon} className="size-4 text-ink" />
                  {t.eyebrow}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </PageHero>

      <Section tone="surface">
        <Container>
          <div className="space-y-20 sm:space-y-28">
            {THEMES.map((t, i) => (
              <FeatureRow key={t.id} theme={t} index={i + 1} flip={i % 2 === 1} headingLevel={2} />
            ))}
          </div>
        </Container>
      </Section>

      <Section labelledBy="platform-title">
        <Container>
          <SectionHeader id="platform-title" marker={t.platformMarker} title={t.platformTitle} />
          <div className="mt-12">
            <PlatformGrid />
          </div>
        </Container>
      </Section>

      <Section tone="surface" labelledBy="faq-title">
        <Container className="grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
          <SectionHeader id="faq-title" marker={t.faqMarker} title={t.faqTitle} />
          <FaqList items={GENERAL_FAQ} />
        </Container>
      </Section>

      <CtaBand />
    </>
  );
}
