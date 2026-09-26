import Link from "next/link";
import { FOOTER_NAV } from "@/content/nav";
import { site } from "@/lib/site";
import { Container } from "./section";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="bg-ink text-white">
      <Container className="py-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-xs">
            <Logo tone="light" />
            <p className="mt-4 text-sm leading-relaxed text-white/55">{site.tagline}.</p>
            {site.contactEmail && (
              <a href={`mailto:${site.contactEmail}`} className="mt-4 inline-block text-sm text-white/75 hover:text-white">
                {site.contactEmail}
              </a>
            )}
          </div>
          {FOOTER_NAV.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="text-sm font-medium text-white">{group.title}</h2>
              <ul className="mt-4 space-y-3">
                {group.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-white/55 transition-colors hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-16 flex flex-col gap-3 border-t border-white/10 pt-8 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Operra</p>
          <p>Product screenshots show the demo workspace with sample data.</p>
        </div>
      </Container>
    </footer>
  );
}
