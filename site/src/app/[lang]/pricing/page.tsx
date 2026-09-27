import { Check } from "lucide-react";
import { ButtonLink } from "@/components/button";
import { CtaBand } from "@/components/cta-band";
import { FaqList } from "@/components/faq";
import { PageHero } from "@/components/page-hero";
import { Container, Section, SectionHeader } from "@/components/section";
import { getContent } from "@/i18n/server";
import { appLinks, trialFor } from "@/lib/app-links";
import { formatPrice, getLivePlans, type LivePlan } from "@/lib/live-plans";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata() {
  const { PAGES, locale } = await getContent();
  return pageMetadata({ title: PAGES.pricing.metaTitle, description: PAGES.pricing.metaDescription, path: "/pricing", locale });
}

const label = "font-mono text-[11px] leading-4 font-medium tracking-[0.08em] uppercase";

// Plans come from the app (control center → Plans); refresh them every minute.
export const revalidate = 60;

type PricingCopy = Awaited<ReturnType<typeof getContent>>["PAGES"]["pricing"];

/** One card per plan on offer, in the visitor's language. */
function PlanCards({ plans, t, locale, cta }: { plans: LivePlan[]; t: PricingCopy; locale: "en" | "ar"; cta: string }) {
  return (
    <div className={`grid gap-6 ${plans.length >= 3 ? "lg:grid-cols-3" : "md:grid-cols-2"}`}>
      {plans.map((p) => {
        const dark = p.featured;
        return (
          <article
            key={p.code}
            aria-labelledby={`plan-${p.code}`}
            className={`relative flex flex-col rounded-lg p-7 sm:p-8 ${dark ? "bg-panel text-on-panel" : "border border-line bg-paper"}`}
          >
            {p.featured && <p className={`mb-3 ${label} ${dark ? "text-on-panel-muted" : "text-muted"}`}>{t.recommended}</p>}
            <h2 id={`plan-${p.code}`} className="text-[22px] leading-7 font-semibold tracking-[-0.01em]">
              {p.name[locale]}
            </h2>
            {p.description[locale] && <p className={`mt-1 text-[14px] leading-5 ${dark ? "text-on-panel-muted" : "text-muted"}`}>{p.description[locale]}</p>}
            {p.price ? (
              <p className="mt-6 flex flex-wrap items-baseline gap-2">
                <span className="font-mono text-[36px] leading-[42px] font-medium">{formatPrice(p.price, locale)}</span>
                <span className={dark ? "text-on-panel-muted" : "text-muted"}>{p.price.interval === "year" ? t.perYear : t.perMonth}</span>
              </p>
            ) : (
              <p className="mt-6 text-[28px] leading-[34px] font-semibold tracking-[-0.02em]">{t.onRequest}</p>
            )}
            {p.trialDays > 0 && (
              <p className={`mt-1 text-[14px] leading-5 ${dark ? "text-on-panel-muted" : "text-muted"}`}>{t.trialLine.replace("{days}", String(p.trialDays))}</p>
            )}
            {p.features[locale].length > 0 && (
              <ul className={`mt-6 border-t ${dark ? "border-line-panel" : "border-line"}`}>
                {p.features[locale].map((f) => (
                  <li key={f} className={`flex gap-3 border-b py-2.5 text-[14px] leading-5 ${dark ? "border-line-panel" : "border-line"}`}>
                    <Check aria-hidden className="mt-0.5 size-4 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-auto pt-8">
              {/* Subscribing is the main action; the free trial is a link in the same card. */}
              <ButtonLink href={trialFor(locale, p.code)} size="lg" variant={dark ? "on-panel" : "primary"} arrow className="w-full">
                {t.subscribe}
              </ButtonLink>
              {p.trialDays > 0 && (
                <a
                  href={trialFor(locale, p.code)}
                  className={`mt-4 block text-center text-[15px] font-medium underline underline-offset-4 ${dark ? "text-on-panel" : "text-ink"}`}
                >
                  {cta.replace("{days}", String(p.trialDays))}
                </a>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

export default async function PricingPage() {
  const { PAGES, PRICING, PRICING_FAQ, GENERAL_FAQ, UI, locale } = await getContent();
  const t = PAGES.pricing;
  const live = await getLivePlans();
  // Several plans on offer: one card each. One (or the app unreachable): the single-plan layout.
  if (live && live.length > 1) {
    return (
      <>
        <PageHero marker={t.marker} title={t.plansTitle} lead={t.plansLead} />
        <Section tone="surface" className="pt-14 sm:pt-16">
          <Container>
            <PlanCards plans={live} t={t} locale={locale} cta={t.startTrialLink} />
          </Container>
        </Section>
        <Section labelledBy="faq-title">
          <Container className="grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
            <SectionHeader id="faq-title" marker={t.faqMarker} title={t.faqTitle} />
            {/* The single-plan answer ("no feature tiers") doesn't apply here. */}
            <FaqList items={[...PRICING_FAQ.filter((_, i) => i !== 2), ...GENERAL_FAQ.slice(0, 3)]} />
          </Container>
        </Section>
        <CtaBand />
      </>
    );
  }
  const only = live?.[0];
  const trialHref = only ? trialFor(locale, only.code) : appLinks(locale).trial;
  const price = only?.price
    ? { amount: formatPrice(only.price, locale), period: only.price.interval === "year" ? t.perYear : t.perMonth, note: undefined }
    : PRICING.price;
  const trialDays = only ? only.trialDays : PRICING.trialDays;
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
                {only?.name[locale] ?? PRICING.plan}
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
