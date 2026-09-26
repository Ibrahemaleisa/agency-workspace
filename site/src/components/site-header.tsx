"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { MAIN_NAV } from "@/content/nav";
import { cn } from "@/lib/cn";
import { Logo } from "./logo";
import { ButtonLink } from "./button";

/** Pages that open with a dark hero; the header matches it until the page scrolls. */
const DARK_HERO = new Set(["/"]);

export function SiteHeader() {
  const pathname = usePathname();
  // The menu belongs to the page it was opened on, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (v: boolean) => setOpenOn(v ? pathname : null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  const dark = DARK_HERO.has(pathname) && !scrolled && !open;
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-[background-color,border-color] duration-300",
        dark
          ? "border-b border-transparent bg-ink text-white"
          : "border-b border-line/80 bg-paper/85 text-ink backdrop-blur-xl supports-[backdrop-filter]:bg-paper/75",
      )}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-ink focus:px-3 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center gap-8 px-5 sm:px-8">
        <Link href="/" aria-label="Operra home" className="shrink-0">
          <Logo tone={dark ? "light" : "dark"} />
        </Link>

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {MAIN_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "rounded-full px-3 py-2 text-[0.9rem] transition-colors",
                    dark ? "text-white/70 hover:text-white" : "text-muted hover:text-ink",
                    isActive(item.href) && (dark ? "text-white" : "text-ink"),
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ms-auto hidden items-center gap-2 md:flex">
          <Link
            href="/login"
            className={cn("rounded-full px-3 py-2 text-[0.9rem]", dark ? "text-white/70 hover:text-white" : "text-muted hover:text-ink")}
          >
            Log in
          </Link>
          <ButtonLink href="/start" variant={dark ? "light" : "primary"}>
            Start free trial
          </ButtonLink>
        </div>

        <button
          type="button"
          className="ms-auto -me-2 inline-flex size-10 items-center justify-center rounded-full md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen(!open)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          {open ? <X aria-hidden className="size-5" /> : <Menu aria-hidden className="size-5" />}
        </button>
      </div>

      {open && (
        <div id="mobile-menu" className="h-[calc(100dvh-4rem)] overflow-y-auto border-t border-line bg-paper px-5 pb-8 md:hidden">
          <nav aria-label="Mobile">
            <ul className="divide-y divide-line">
              {MAIN_NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className="block py-4 text-lg font-medium tracking-tight"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/about" className="block py-4 text-lg font-medium tracking-tight">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="block py-4 text-lg font-medium tracking-tight">
                  Contact
                </Link>
              </li>
            </ul>
          </nav>
          <div className="mt-6 grid gap-3">
            <ButtonLink href="/start" size="lg">
              Start free trial
            </ButtonLink>
            <ButtonLink href="/login" size="lg" variant="secondary">
              Log in
            </ButtonLink>
          </div>
        </div>
      )}
    </header>
  );
}
