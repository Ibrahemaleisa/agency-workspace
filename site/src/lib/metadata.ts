import type { Metadata } from "next";
import { localePath, type Locale } from "@/i18n/config";
import { site } from "./site";

/** The site's Open Graph card (app/opengraph-image.tsx). Pages set it explicitly: it lives outside [lang]. */
export const OG_IMAGES = [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${site.name} — ${site.tagline}` }];

/** Per-page metadata: canonical URL for this language, hreflang alternates, matching Open Graph fields. */
export function pageMetadata({
  title,
  description,
  path,
  locale,
}: {
  title: string;
  description: string;
  path: string;
  locale: Locale;
}): Metadata {
  const url = localePath(locale, path);
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: { en: localePath("en", path), ar: localePath("ar", path), "x-default": localePath("en", path) },
    },
    openGraph: { title: `${title} · ${site.name}`, description, url, siteName: site.name, type: "website", images: OG_IMAGES },
    twitter: { card: "summary_large_image", title: `${title} · ${site.name}`, description, images: OG_IMAGES },
  };
}
