import { getContent } from "@/i18n/server";
import { site } from "@/lib/site";
import { Container } from "./section";
import { LocalLink } from "./local-link";
import { Wordmark } from "./logo";

export async function SiteFooter() {
  const { FOOTER_NAV, UI, locale } = await getContent();
  const ar = locale === "ar";
  return (
    <footer className="border-t border-line bg-paper">
      <Container className="py-14">
        <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            {/* Descriptor lock-up: wordmark above the descriptor, with the other language small. */}
            <Wordmark className="h-6" />
            <p className="mt-4 font-mono text-[11px] leading-4 font-medium tracking-[0.08em] text-muted uppercase">
              {ar ? site.descriptorAr : site.descriptor}
            </p>
            <p className="mt-1 text-[13px] leading-5 text-muted">
              <span lang={ar ? "en" : "ar"} dir={ar ? "ltr" : "rtl"}>
                {ar ? site.descriptor : site.descriptorAr}
              </span>
            </p>
            {site.contactEmail && (
              <a href={`mailto:${site.contactEmail}`} className="mt-6 inline-block text-[14px] text-ink underline-offset-4 hover:underline">
                {site.contactEmail}
              </a>
            )}
          </div>
          {FOOTER_NAV.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="font-mono text-[11px] leading-4 font-medium tracking-[0.08em] text-muted uppercase">{group.title}</h2>
              <ul className="mt-4 space-y-2.5">
                {group.links.map((l) => (
                  <li key={l.href}>
                    <LocalLink href={l.href} className="text-[14px] text-ink/80 transition-colors hover:text-ink">
                      {l.label}
                    </LocalLink>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-14 flex flex-col gap-2 border-t border-line pt-6 font-mono text-[11px] leading-4 tracking-[0.04em] text-muted sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} OPERRA</p>
          <p>{UI.footerNote}</p>
        </div>
      </Container>
    </footer>
  );
}
