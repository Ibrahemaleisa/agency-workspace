import { ButtonLink } from "@/components/button";
import { TrialForm } from "@/components/inquiry-forms";
import { LocalLink } from "@/components/local-link";
import { Container } from "@/components/section";
import { StatusDot } from "@/components/status-dot";
import { getContent } from "@/i18n/server";
import { appLinks } from "@/lib/app-links";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata() {
  const { PAGES, locale } = await getContent();
  return pageMetadata({ title: PAGES.start.metaTitle, description: PAGES.start.metaDescription, path: "/start", locale });
}

const label = "font-mono text-[11px] leading-4 font-medium tracking-[0.08em] uppercase";

/**
 * With the Operra app configured, sign-up is self-serve and this page explains the steps and hands
 * over to the app. Without it, it's the request form: the team sets the workspace up by hand.
 */
export default async function StartPage() {
  const { PAGES, locale } = await getContent();
  const t = PAGES.start;
  const links = appLinks(locale);
  const selfServe = !links.trial.startsWith("/");

  return (
    <div className="bg-paper py-14 sm:py-20">
      <Container className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <div>
          <p className={`text-muted ${label}`}>{t.marker}</p>
          <h1 className="mt-4 text-[40px] leading-[44px] font-semibold tracking-[-0.03em] sm:text-[48px] sm:leading-[52px]">{t.title}</h1>
          <p className="mt-4 text-[17px] leading-[26px] text-muted">{selfServe ? t.selfServeLead : t.requestLead}</p>
          {selfServe ? (
            <div className="mt-8">
              {/* The one decisive moment on this page. */}
              <ButtonLink href={links.trial} size="lg" variant="signal" arrow>
                {t.selfServeCta}
              </ButtonLink>
            </div>
          ) : (
            <>
              <h2 className={`mt-12 text-muted ${label}`}>{t.nextTitle}</h2>
              <Steps steps={t.requestSteps} />
            </>
          )}
          <ul className="mt-10 grid grid-cols-2 gap-x-6 border-t border-line pt-6">
            {t.included.map((i) => (
              <li key={i} className="border-b border-line py-2.5 text-[14px] leading-5">
                {i}
              </li>
            ))}
          </ul>
        </div>
        <div className="self-start rounded-lg border border-line bg-surface p-5 sm:p-8">
          {selfServe ? (
            <>
              <h2 className={`text-muted ${label}`}>{t.nextTitle}</h2>
              <Steps steps={t.selfServeSteps} />
              <p className="flex flex-wrap items-center gap-x-1 border-t border-line pt-5 text-[14px] leading-5 text-muted">
                {t.selfServeAlt}
                <LocalLink href="/contact" className="text-ink underline underline-offset-4">
                  {PAGES.pricing.talk}
                </LocalLink>
              </p>
            </>
          ) : (
            <TrialForm />
          )}
        </div>
      </Container>
    </div>
  );
}

function Steps({ steps }: { steps: { title: string; body: string }[] }) {
  return (
    <ol className="mt-5">
      {steps.map((n, i) => (
        <li key={n.title} className="flex gap-4">
          <div className="flex flex-col items-center">
            <StatusDot state={i === 0 ? "live" : "draft"} className="mt-1.5" />
            {i < steps.length - 1 && <span aria-hidden className="mt-1.5 w-px flex-1 bg-line-strong" />}
          </div>
          <div className="pb-6">
            <p className="text-[15px] leading-[22px] font-medium">{n.title}</p>
            <p className="mt-0.5 text-[14px] leading-5 text-muted">{n.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
