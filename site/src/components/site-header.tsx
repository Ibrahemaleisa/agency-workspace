"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import type { NavLink } from "@/content/en/nav";
import { barePath, switchLocalePath } from "@/i18n/config";
import { useLocale } from "@/i18n/provider";
import { appLinks } from "@/lib/app-links";
import { cn } from "@/lib/cn";
import { Wordmark } from "./logo";
import { ButtonLink } from "./button";
import { LocalLink } from "./local-link";

/** EN | العربية — the same page in the other language. */
function LanguageSwitch({ pathname, className }: { pathname: string; className?: string }) {
  const { ui } = useLocale();
  const other = ui.otherLanguageCode === "ar" ? "ar" : "en";
  return (
    <Link
      href={switchLocalePath(pathname, other) as Route}
      hrefLang={other}
      lang={other}
      className={cn("rounded-md px-2.5 py-1.5 text-[14px] text-muted transition-colors hover:text-ink", className)}
    >
      <span className="sr-only">{ui.language}: </span>
      {ui.otherLanguage}
    </Link>
  );
}

export function SiteHeader({ nav, mobileNav }: { nav: NavLink[]; mobileNav: NavLink[] }) {
  const pathname = usePathname();
  const { locale, ui } = useLocale();
  const links = appLinks(locale);
  // The menu belongs to the page it was opened on, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;

  // Escape closes the menu; the page behind it doesn't scroll while it's open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenOn(null);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) => {
    const bare = barePath(pathname);
    return bare === href || bare.startsWith(`${href}/`);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/90 backdrop-blur-md supports-[backdrop-filter]:bg-paper/80">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-ink focus:px-3 focus:py-2 focus:text-paper"
      >
        {ui.skip}
      </a>
      <div className="mx-auto flex h-14 w-full max-w-[1200px] items-center gap-8 px-4 sm:px-8">
        <LocalLink href="/" aria-label={ui.home} className="-m-2 shrink-0 p-2">
          <Wordmark className="h-6" title="Operra" />
        </LocalLink>

        <nav aria-label={ui.mainNav} className="hidden md:block">
          <ul className="flex items-center gap-1">
            {nav.map((item) => (
              <li key={item.href}>
                <LocalLink
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-[14px] transition-colors",
                    isActive(item.href) ? "text-ink" : "text-muted hover:text-ink",
                  )}
                >
                  {item.label}
                </LocalLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ms-auto hidden items-center gap-2 md:flex">
          <LanguageSwitch pathname={pathname} />
          <ButtonLink href={links.login ?? "/login"} variant="ghost">
            {ui.logIn}
          </ButtonLink>
          <ButtonLink href={links.trial}>{ui.startTrial}</ButtonLink>
        </div>

        <button
          type="button"
          className="ms-auto -me-2 inline-flex size-10 items-center justify-center rounded-md md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpenOn(open ? null : pathname)}
        >
          <span className="sr-only">{open ? ui.closeMenu : ui.openMenu}</span>
          {open ? <X aria-hidden className="size-5" /> : <Menu aria-hidden className="size-5" />}
        </button>
      </div>

      {open && (
        <div id="mobile-menu" className="h-[calc(100dvh-3.5rem)] overflow-y-auto border-t border-line bg-paper px-4 pb-8 md:hidden">
          <nav aria-label={ui.mobileNav}>
            <ul className="divide-y divide-line">
              {mobileNav.map((item) => (
                <li key={item.href}>
                  <LocalLink
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className="block py-4 text-[18px] font-medium tracking-[-0.01em]"
                  >
                    {item.label}
                  </LocalLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-6 grid gap-3">
            <ButtonLink href={links.trial} size="lg">
              {ui.startTrial}
            </ButtonLink>
            <ButtonLink href={links.login ?? "/login"} size="lg" variant="secondary">
              {ui.logIn}
            </ButtonLink>
            <LanguageSwitch pathname={pathname} className="mt-2 text-center text-[16px]" />
          </div>
        </div>
      )}
    </header>
  );
}
