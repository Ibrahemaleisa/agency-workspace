import { CtaBand } from "@/components/cta-band";
import { FaqList } from "@/components/faq";
import { FeatureRow } from "@/components/feature-row";
import { Icon } from "@/components/icon";
import { PageHero } from "@/components/page-hero";
import { PlatformGrid } from "@/components/platform-grid";
import { Container, Section, SectionHeader } from "@/components/section";
import { THEMES } from "@/content/features";
import { GENERAL_FAQ } from "@/content/pricing";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Features",
  description:
    "Reusable workflows, client approvals, a client portal, project and team chat, role dashboards, a project health matrix and white-label branding — every Operra feature, shown in the real product.",
  path: "/features",
});

export default function FeaturesPage() {
  return (
    <>
      <PageHero
        eyebrow="Features"
        title="What Operra does, shown in the product."
        lead="No roadmap promises — every screen on this page is the product as it works today."
      >
        <nav aria-label="Feature sections">
          <ul className="flex flex-wrap gap-2">
            {THEMES.map((t) => (
              <li key={t.id}>
                <a
                  href={`#${t.id}`}
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm transition-colors hover:border-ink/25"
                >
                  <Icon name={t.icon} className="size-3.5 text-sand-deep" />
                  {t.eyebrow}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </PageHero>

      <Section tone="white">
        <Container>
          <div className="space-y-24 sm:space-y-32">
            {THEMES.map((t, i) => (
              <FeatureRow key={t.id} theme={t} flip={i % 2 === 1} headingLevel={2} />
            ))}
          </div>
        </Container>
      </Section>

      <Section labelledBy="platform-title" className="border-t border-line">
        <Container>
          <SectionHeader
            id="platform-title"
            eyebrow="Platform"
            title="The foundations under every workspace."
          />
          <div className="mt-12">
            <PlatformGrid />
          </div>
        </Container>
      </Section>

      <Section tone="white" labelledBy="faq-title" className="border-t border-line">
        <Container className="grid gap-12 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
          <SectionHeader id="faq-title" eyebrow="Questions" title="Details people ask about." />
          <FaqList items={GENERAL_FAQ} />
        </Container>
      </Section>

      <CtaBand />
    </>
  );
}
