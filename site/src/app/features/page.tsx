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
        marker="Features"
        title="What Operra does, shown in the product"
        lead="No roadmap promises. Every screen on this page is the product as it works today."
      >
        <nav aria-label="Feature sections">
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
          <SectionHeader id="platform-title" marker="Platform" title="The foundations under every workspace" />
          <div className="mt-12">
            <PlatformGrid />
          </div>
        </Container>
      </Section>

      <Section tone="surface" labelledBy="faq-title">
        <Container className="grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
          <SectionHeader id="faq-title" marker="Questions" title="Details people ask about" />
          <FaqList items={GENERAL_FAQ} />
        </Container>
      </Section>

      <CtaBand />
    </>
  );
}
