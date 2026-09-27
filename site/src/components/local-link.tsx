"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { localePath } from "@/i18n/config";
import { useLocale } from "@/i18n/provider";

/**
 * next/link that keeps the visitor in their language: "/pricing" becomes "/ar/pricing" on the Arabic
 * site. Absolute URLs (the Operra app) render as a plain anchor.
 */
export function LocalLink({ href, ...rest }: Omit<ComponentProps<typeof Link>, "href"> & { href: string }) {
  const { locale } = useLocale();
  if (/^[a-z]+:/i.test(href)) {
    // Drop the router-only props; everything else is a plain anchor attribute.
    const { prefetch, replace, scroll, ...anchor } = rest;
    void [prefetch, replace, scroll];
    return <a href={href} {...(anchor as ComponentProps<"a">)} />;
  }
  return <Link href={localePath(locale, href) as ComponentProps<typeof Link>["href"]} {...rest} />;
}
