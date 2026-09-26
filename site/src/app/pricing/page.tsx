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

export default function PricingPage() {
  const { price, trialDays } = PRICING;
  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title="One plan. Everything included."
        lead={PRICING.blurb}
        align="center"
      />

      <Section tone="white" className="pt-16 sm:pt-20">
        <Container>
          <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <article
              aria-labelledby="trial-title"
              className="flex flex-col rounded-[var(--radius-frame)] border border-line bg-paper p-8"
            >
              <h2 id="trial-title" className="text-lg font-semibold tracking-tight">
                Free trial
              </h2>
              <p className="mt-6 text-4xl font-semibold tracking-[-0.04em]">Free</p>
              <p className="mt-2 text-sm text-muted">
                {trialDays ? `${trialDays} days, then choose to continue.` : "Try it with your own team and clients."}
              </p>
              <ul className="mt-8 space-y-3 text-[0.95rem]">
                {["Your own workspace and database", "Every feature switched on", "Your brand from day one"].map((i) => (
                  <li key={i} className="flex gap-3">
                    <Check aria-hidden className="mt-1 size-4 shrink-0 text-sand-deep" strokeWidth={2.25} />
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

            <article
              aria-labelledby="plan-title"
              className="flex flex-col rounded-[var(--radius-frame)] border border-ink bg-ink p-8 text-white shadow-[0_24px_48px_-16px_rgb(0_0_0/0.35)]"
            >
              <h2 id="plan-title" className="text-lg font-semibold tracking-tight">
                {PRICING.plan}
              </h2>
              {price ? (
                <p className="mt-6 flex items-baseline gap-2">
                  <span className="text-4xl font-semibold tracking-[-0.04em]">{price.amount}</span>
                  <span className="text-white/60">{price.period}</span>
                </p>
              ) : (
                <p className="mt-6 text-4xl font-semibold tracking-[-0.04em]">Priced per agency</p>
              )}
              <p className="mt-2 text-sm text-white/60">
                {price?.note ?? "Based on the size of your team. Tell us about your agency and we’ll send a quote."}
              </p>
              <ul className="mt-8 grid gap-3 text-[0.95rem] sm:grid-cols-2">
                {PRICING.included.map((i) => (
                  <li key={i} className="flex gap-3">
                    <Check aria-hidden className="mt-1 size-4 shrink-0 text-sand" strokeWidth={2.25} />
                    <span className="text-white/85">{i}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex flex-col gap-3 pt-10 sm:flex-row">
                <ButtonLink href="/start" variant="light" size="lg" arrow className="sm:flex-1">
                  Start free trial
                </ButtonLink>
                <ButtonLink href="/contact" variant="ghost-light" size="lg" className="sm:flex-1">
                  Talk to us
                </ButtonLink>
              </div>
            </article>
          </div>
        </Container>
      </Section>

      <Section labelledBy="faq-title" className="border-t border-line">
        <Container className="grid gap-12 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
          <SectionHeader id="faq-title" eyebrow="Questions" title="Pricing and setup, answered." />
          <FaqList items={[...PRICING_FAQ, ...GENERAL_FAQ.slice(0, 3)]} />
        </Container>
      </Section>

      <CtaBand />
    </>
  );
}
