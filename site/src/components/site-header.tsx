"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { MAIN_NAV, MOBILE_NAV } from "@/content/nav";
import { cn } from "@/lib/cn";
import { Wordmark } from "./logo";
import { ButtonLink } from "./button";

export function SiteHeader() {
  const pathname = usePathname();
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

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/90 backdrop-blur-md supports-[backdrop-filter]:bg-paper/80">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-ink focus:px-3 focus:py-2 focus:text-paper"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-14 w-full max-w-[1200px] items-center gap-8 px-4 sm:px-8">
        <Link href="/" aria-label="Operra home" className="-m-2 shrink-0 p-2">
          <Wordmark className="h-6" title="Operra" />
        </Link>

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {MAIN_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-[14px] transition-colors",
                    isActive(item.href) ? "text-ink" : "text-muted hover:text-ink",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ms-auto hidden items-center gap-2 md:flex">
          <ButtonLink href="/login" variant="ghost">
            Log in
          </ButtonLink>
          <ButtonLink href="/start">Start free trial</ButtonLink>
        </div>

        <button
          type="button"
          className="ms-auto -me-2 inline-flex size-10 items-center justify-center rounded-md md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpenOn(open ? null : pathname)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          {open ? <X aria-hidden className="size-5" /> : <Menu aria-hidden className="size-5" />}
        </button>
      </div>

      {open && (
        <div id="mobile-menu" className="h-[calc(100dvh-3.5rem)] overflow-y-auto border-t border-line bg-paper px-4 pb-8 md:hidden">
          <nav aria-label="Mobile">
            <ul className="divide-y divide-line">
              {MOBILE_NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className="block py-4 text-[18px] font-medium tracking-[-0.01em]"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
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
