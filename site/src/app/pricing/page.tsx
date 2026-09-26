import { Check } from "lucide-react";
import { ButtonLink } from "@/components/button";
import { CtaBand } from "@/components/cta-band";
import { FaqList } from "@/components/faq";
import { PageHero } from "@/components/page-hero";
import { Container, Section, SectionHeader } from "@/components/section";
import { GENERAL_FAQ, PRICING, PRICING_FAQ } from "@/content/pricing";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Pricing",
  description: "One Operra plan with every feature included: a dedicated, branded workspace for your agency. Start with a free trial.",
  path: "/pricing",
});

const label = "font-mono text-[11px] leading-4 font-medium tracking-[0.08em] uppercase";

export default function PricingPage() {
  const { price, trialDays } = PRICING;
  return (
    <>
      <PageHero marker="Pricing" title="One plan, everything included" lead={PRICING.blurb} />

      <Section tone="surface" className="pt-14 sm:pt-16">
        <Container>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <article aria-labelledby="trial-title" className="flex flex-col rounded-lg border border-line bg-paper p-7 sm:p-8">
              <h2 id="trial-title" className={`text-muted ${label}`}>
                Free trial
              </h2>
              <p className="mt-5 text-[40px] leading-[46px] font-semibold tracking-[-0.03em]">Free</p>
              <p className="mt-1 text-[14px] leading-5 text-muted">
                {trialDays ? `${trialDays} days, then choose to continue.` : "Try it with your own team and clients."}
              </p>
              <ul className="mt-8 divide-y divide-line border-y border-line">
                {["Your own workspace and database", "Every feature switched on", "Your brand from day one"].map((i) => (
                  <li key={i} className="flex gap-3 py-2.5 text-[14px] leading-5">
                    <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-ink" />
                    {i}
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-10">
                <ButtonLink href="/start" size="lg" variant="secondary" className="w-full">
                  Start free trial
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
                <p className="mt-5 text-[40px] leading-[46px] font-semibold tracking-[-0.03em]">Priced per agency</p>
              )}
              <p className="mt-1 text-[14px] leading-5 text-on-panel-muted">
                {price?.note ?? "Based on the size of your team. Tell us about your agency and we’ll send a quote."}
              </p>
              <ul className="mt-8 grid border-t border-line-panel sm:grid-cols-2 sm:gap-x-8">
                {PRICING.included.map((i) => (
                  <li key={i} className="flex gap-3 border-b border-line-panel py-2.5 text-[14px] leading-5">
                    <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-on-panel" />
                    <span>{i}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex flex-col gap-3 pt-10 sm:flex-row">
                <ButtonLink href="/start" variant="on-panel" size="lg" arrow className="sm:flex-1">
                  Start free trial
                </ButtonLink>
                <ButtonLink href="/contact" variant="on-panel-secondary" size="lg" className="sm:flex-1">
                  Talk to us
                </ButtonLink>
              </div>
            </article>
          </div>
        </Container>
      </Section>

      <Section labelledBy="faq-title">
        <Container className="grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
          <SectionHeader id="faq-title" marker="Questions" title="Pricing and setup, answered" />
          <FaqList items={[...PRICING_FAQ, ...GENERAL_FAQ.slice(0, 3)]} />
        </Container>
      </Section>

      <CtaBand />
    </>
  );
}
