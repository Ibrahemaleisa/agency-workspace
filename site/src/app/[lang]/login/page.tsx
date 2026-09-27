import { ExternalLink } from "lucide-react";
import { redirect } from "next/navigation";
import type { Route } from "next";
import { ButtonLink } from "@/components/button";
import { LocalLink } from "@/components/local-link";
import { LiveO } from "@/components/logo";
import { Container } from "@/components/section";
import { WorkspaceLogin } from "@/components/workspace-login";
import { getContent } from "@/i18n/server";
import { appLinks } from "@/lib/app-links";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata() {
  const { PAGES, locale } = await getContent();
  return pageMetadata({ title: PAGES.login.metaTitle, description: PAGES.login.metaDescription, path: "/login", locale });
}

const label = "font-mono text-[11px] leading-4 font-medium tracking-[0.08em] uppercase";
const link = "text-ink underline underline-offset-4";

export default async function LoginPage() {
  const { PAGES, UI, locale } = await getContent();
  const t = PAGES.login;
  const links = appLinks(locale);
  // Platform: customers sign in on the app with the email and password they signed up with.
  if (links.login) redirect(links.login as Route);
  return (
    <div className="bg-paper py-16 sm:py-24">
      <Container>
        <div className="mx-auto max-w-lg">
          <LiveO className="size-10" />
          <h1 className="mt-6 text-[32px] leading-[38px] font-semibold tracking-[-0.02em] sm:text-[40px] sm:leading-[46px]">{t.title}</h1>
          {links.login ? (
            <>
              {/* Platform: one sign-in for every agency; the app hands off to the agency's own address. */}
              <p className="mt-3 text-[17px] leading-[26px] text-muted">{t.appLead}</p>
              <div className="mt-8">
                <ButtonLink href={links.login} size="lg" arrow className="w-full sm:w-auto">
                  {t.appCta}
                </ButtonLink>
              </div>
              <div className="mt-10 rounded-lg border border-line bg-surface p-5 sm:p-6">
                <h2 className={`mb-4 text-muted ${label}`}>{t.ownDomain}</h2>
                <WorkspaceLogin />
              </div>
            </>
          ) : (
            <>
              <p className="mt-3 text-[17px] leading-[26px] text-muted">{t.lead}</p>
              <div className="mt-8 rounded-lg border border-line bg-surface p-5 sm:p-6">
                <WorkspaceLogin />
              </div>
            </>
          )}
          <dl className="mt-10 divide-y divide-line border-y border-line text-[15px] leading-[22px]">
            <div className="py-4">
              <dt className={`text-muted ${label}`}>{t.unknownTitle}</dt>
              <dd className="mt-1.5 text-muted">{t.unknownBody}</dd>
            </div>
            <div className="py-4">
              <dt className={`text-muted ${label}`}>{t.forgotTitle}</dt>
              <dd className="mt-1.5 text-muted">{t.forgotBody}</dd>
            </div>
            <div className="py-4">
              <dt className={`text-muted ${label}`}>{t.noneTitle}</dt>
              <dd className="mt-1.5 text-muted">
                <LocalLink href={links.trial} className={link}>
                  {t.noneStart}
                </LocalLink>{" "}
                {t.or}{" "}
                {links.demoIsExternal ? (
                  <a href={links.demo} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1 ${link}`}>
                    {t.noneDemo}
                    <ExternalLink aria-hidden className="size-3.5" />
                    <span className="sr-only">{UI.newTab}</span>
                  </a>
                ) : (
                  <LocalLink href={links.demo} className={link}>
                    {t.noneDemo}
                  </LocalLink>
                )}
                .
              </dd>
            </div>
          </dl>
        </div>
      </Container>
    </div>
  );
}
