import type { Metadata } from "next";
import { site } from "./site";

/** Per-page metadata with a canonical URL and matching Open Graph fields. */
export function pageMetadata({ title, description, path }: { title: string; description: string; path: string }): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title: `${title} · ${site.name}`, description, url: path, siteName: site.name, type: "website" },
    twitter: { card: "summary_large_image", title: `${title} · ${site.name}`, description },
  };
}
