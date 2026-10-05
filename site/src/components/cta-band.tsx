import { getContent } from "@/i18n/server";
import { appLinks } from "@/lib/app-links";
import { site } from "@/lib/site";
import { ButtonLink } from "./button";
import { Mark } from "./logo";
import { Container } from "./section";

/** Closing lapis band. The mark sits large and quiet off the trailing edge, filling in the reading direction. */
export async function CtaBand({ title, lead }: { title?: string; lead?: string }) {
  const { UI, locale } = await getContent();
  const links = appLinks(locale);
  return (
    <section aria-labelledby="cta-title" className="relative overflow-hidden bg-panel py-20 text-on-panel sm:py-28">
      <Mark tone="panel-graphic" rtl={locale === "ar"} className="pointer-events-none absolute -end-56 top-1/2 hidden size-[560px] -translate-y-1/2 md:block lg:-end-24" />
      <Container className="relative">
        <p className="text-[13px] leading-5 font-medium text-on-panel-muted">
          {locale === "ar" ? site.taglineAr : site.tagline}
        </p>
        <h2 id="cta-title" className="mt-4 max-w-2xl text-[32px] leading-[38px] font-semibold tracking-[-0.025em] sm:text-[48px] sm:leading-[52px] sm:tracking-[-0.03em]">
          {title ?? UI.cta.title}
        </h2>
        <p className="mt-4 max-w-xl text-[17px] leading-[26px] text-on-panel-muted">{lead ?? UI.cta.lead}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href={links.trial} variant="on-panel" size="lg" arrow>
            {UI.startTrial}
          </ButtonLink>
          <ButtonLink href={links.demo} variant="on-panel-secondary" size="lg" external={links.demoIsExternal} newTabLabel={UI.newTab}>
            {UI.openDemo}
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
