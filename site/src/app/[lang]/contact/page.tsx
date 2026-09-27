import { ContactForm } from "@/components/inquiry-forms";
import { LocalLink } from "@/components/local-link";
import { PageHero } from "@/components/page-hero";
import { Container, Section } from "@/components/section";
import { getContent } from "@/i18n/server";
import { pageMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";

export async function generateMetadata() {
  const { PAGES, locale } = await getContent();
  return pageMetadata({ title: PAGES.contact.metaTitle, description: PAGES.contact.metaDescription, path: "/contact", locale });
}

const label = "font-mono text-[11px] leading-4 font-medium tracking-[0.08em] uppercase";
const link = "text-ink underline underline-offset-4";

export default async function ContactPage() {
  const { PAGES } = await getContent();
  const t = PAGES.contact;
  return (
    <>
      <PageHero marker={t.marker} title={t.title} lead={t.lead} />
      <Section tone="surface" className="pt-12 sm:pt-14">
        <Container className="grid gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:gap-16">
          <ContactForm />
          <aside className="space-y-8 text-[15px] leading-[22px] lg:border-s lg:border-line lg:ps-12">
            {site.contactEmail && (
              <div>
                <h2 className={`text-muted ${label}`}>{t.email}</h2>
                <a href={`mailto:${site.contactEmail}`} className={`mt-2 inline-block ${link}`} dir="ltr">
                  {site.contactEmail}
                </a>
              </div>
            )}
            <div>
              <h2 className={`text-muted ${label}`}>{t.lookingTitle}</h2>
              <p className="mt-2 text-muted">
                {t.lookingBefore && `${t.lookingBefore} `}
                <LocalLink href="/demo" className={link}>
                  {t.lookingLink}
                </LocalLink>{" "}
                {t.lookingAfter}
              </p>
            </div>
            <div>
              <h2 className={`text-muted ${label}`}>{t.alreadyTitle}</h2>
              <p className="mt-2 text-muted">
                {t.alreadyBefore}{" "}
                <LocalLink href="/login" className={link}>
                  {t.alreadyLink}
                </LocalLink>
                .
              </p>
            </div>
          </aside>
        </Container>
      </Section>
    </>
  );
}
