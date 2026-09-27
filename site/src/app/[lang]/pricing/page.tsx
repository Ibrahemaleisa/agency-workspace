import { Check } from "lucide-react";
import { ButtonLink } from "@/components/button";
import { CtaBand } from "@/components/cta-band";
import { FaqList } from "@/components/faq";
import { PageHero } from "@/components/page-hero";
import { Container, Section, SectionHeader } from "@/components/section";
import { getContent } from "@/i18n/server";
import { appLinks } from "@/lib/app-links";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata() {
  const { PAGES, locale } = await getContent();
  return pageMetadata({ title: PAGES.pricing.metaTitle, description: PAGES.pricing.metaDescription, path: "/pricing", locale });
}

const label = "font-mono text-[11px] leading-4 font-medium tracking-[0.08em] uppercase";

export default async function PricingPage() {
  const { PAGES, PRICING, PRICING_FAQ, GENERAL_FAQ, UI, locale } = await getContent();
  const t = PAGES.pricing;
  const trialHref = appLinks(locale).trial;
  const { price, trialDays } = PRICING;
  return (
    <>
      <PageHero marker={t.marker} title={t.title} lead={PRICING.blurb} />

      <Section tone="surface" className="pt-14 sm:pt-16">
        <Container>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <article aria-labelledby="trial-title" className="flex flex-col rounded-lg border border-line bg-paper p-7 sm:p-8">
              <h2 id="trial-title" className={`text-muted ${label}`}>
                {t.trial}
              </h2>
              <p className="mt-5 text-[40px] leading-[46px] font-semibold tracking-[-0.03em]">{t.free}</p>
              <p className="mt-1 text-[14px] leading-5 text-muted">
                {trialDays ? t.trialDays.replace("{days}", String(trialDays)) : t.trialNoDays}
              </p>
              <ul className="mt-8 divide-y divide-line border-y border-line">
                {t.trialPoints.map((i) => (
                  <li key={i} className="flex gap-3 py-2.5 text-[14px] leading-5">
                    <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-ink" />
                    {i}
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-10">
                <ButtonLink href={trialHref} size="lg" variant="secondary" className="w-full">
                  {UI.startTrial}
                </ButtonLink>
              </div>
            </article>

            <article aria-labelledby="plan-title" className="flex flex-col rounded-lg bg-panel p-7 text-on-panel sm:p-8">
              <h2 id="plan-title" className={`text-on-panel-muted ${label}`}>
                {PRICING.plan}
              </h2>
              {price ? (
                <p className="mt-5 flex items-baseline gap-2">
                  <span className="font-mono text-[40px] leading-[46px] font-medium">{price.amount}</span>
                  <span className="text-on-panel-muted">{price.period}</span>
                </p>
              ) : (
                <p className="mt-5 text-[40px] leading-[46px] font-semibold tracking-[-0.03em]">{t.perAgency}</p>
              )}
              <p className="mt-1 text-[14px] leading-5 text-on-panel-muted">{price?.note ?? t.perAgencyNote}</p>
              <ul className="mt-8 grid border-t border-line-panel sm:grid-cols-2 sm:gap-x-8">
                {PRICING.included.map((i) => (
                  <li key={i} className="flex gap-3 border-b border-line-panel py-2.5 text-[14px] leading-5">
                    <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-on-panel" />
                    <span>{i}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex flex-col gap-3 pt-10 sm:flex-row">
                <ButtonLink href={trialHref} variant="on-panel" size="lg" arrow className="sm:flex-1">
                  {UI.startTrial}
                </ButtonLink>
                <ButtonLink href="/contact" variant="on-panel-secondary" size="lg" className="sm:flex-1">
                  {t.talk}
                </ButtonLink>
              </div>
            </article>
          </div>
        </Container>
      </Section>

      <Section labelledBy="faq-title">
        <Container className="grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
          <SectionHeader id="faq-title" marker={t.faqMarker} title={t.faqTitle} />
          <FaqList items={[...PRICING_FAQ, ...GENERAL_FAQ.slice(0, 3)]} />
        </Container>
      </Section>

      <CtaBand />
    </>
  );
}
