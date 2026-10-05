import { ExternalLink } from "lucide-react";
import { ButtonLink } from "@/components/button";
import { CtaBand } from "@/components/cta-band";
import { PageHero } from "@/components/page-hero";
import { ProductFrame } from "@/components/product-frame";
import { Container, Section, SectionHeader } from "@/components/section";
import { WorkflowSection } from "@/components/workflow-section";
import { getContent } from "@/i18n/server";
import { appLinks } from "@/lib/app-links";
import { pageMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";

export async function generateMetadata() {
  const { PAGES, locale } = await getContent();
  return pageMetadata({ title: PAGES.demo.metaTitle, description: PAGES.demo.metaDescription, path: "/demo", locale });
}

const label = "text-[13px] leading-5 font-medium";

export default async function DemoPage() {
  const { PAGES, AUDIENCES, UI, locale } = await getContent();
  const t = PAGES.demo;
  const links = appLinks(locale);
  /* One view per product role: the buyer's admin dashboard, a daily user's, and a guest's. */
  const views = AUDIENCES.filter((a) => a.id !== "champion");

  return (
    <>
      <PageHero marker={t.marker} title={t.title} lead={t.lead} />

      <Section tone="surface" className="pt-12 sm:pt-14" labelledBy="tour-title">
        <Container>
          <h2 id="tour-title" className="sr-only">
            {t.tourTitle}
          </h2>
          <WorkflowSection />
        </Container>
      </Section>

      <Section labelledBy="live-title">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-16">
            <div>
              <SectionHeader
                id="live-title"
                marker={t.liveMarker}
                index={1}
                title={t.liveTitle}
                lead={links.demoIsExternal ? t.accountsLead : t.previewLead}
              />
              <div className="mt-8">
                {links.demoIsExternal ? (
                  <ButtonLink href={links.demo} size="lg" external newTabLabel={UI.newTab}>
                    {UI.openDemo}
                    <ExternalLink aria-hidden className="size-4" />
                  </ButtonLink>
                ) : (
                  <ButtonLink href={links.demo} size="lg" arrow>
                    {t.previewCta}
                  </ButtonLink>
                )}
              </div>
              <p className="mt-4 text-[13px] leading-[18px] text-muted">{links.demoIsExternal ? t.accountsNote : t.previewNote}</p>
            </div>
            {/* The legacy shared demo needs sign-ins; the app's preview doesn't. */}
            {links.demoIsExternal && (
              <div className="self-start rounded-lg border border-line bg-surface">
                <h3 className={`border-b border-line px-5 py-3 text-muted ${label}`}>{t.signIns}</h3>
                <dl className="divide-y divide-line px-5">
                  {site.demoAccounts.map((a, i) => (
                    <div key={a.email} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3">
                      <dt className="text-[14px] text-muted">{t.roles[i]}</dt>
                      <dd className="font-mono text-[13px]" dir="ltr">
                        {a.email}
                      </dd>
                    </div>
                  ))}
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3">
                    <dt className="text-[14px] text-muted">{t.passwordAll}</dt>
                    <dd className="font-mono text-[13px]">{site.demoPassword}</dd>
                  </div>
                </dl>
              </div>
            )}
          </div>
        </Container>
      </Section>

      <Section tone="surface" labelledBy="views-title">
        <Container>
          <SectionHeader id="views-title" marker={t.viewsMarker} index={2} title={t.viewsTitle} />
          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            {views.map((v) => (
              <figure key={v.id}>
                <ProductFrame shot={v.shot} sizes="(min-width: 1024px) 370px, 100vw" />
                <figcaption className="mt-4">
                  <p className={`text-muted ${label}`}>{v.productRole}</p>
                  <p className="mt-1.5 text-[15px] leading-[22px] font-semibold">{v.who}</p>
                  <p className="mt-1 text-[14px] leading-5 text-muted">{v.does[0]}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </Container>
      </Section>

      <CtaBand title={t.ctaTitle} />
    </>
  );
}
