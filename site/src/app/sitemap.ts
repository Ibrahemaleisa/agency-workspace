import type { MetadataRoute } from "next";
import { SOLUTIONS } from "@/content/en/solutions";
import { localePath } from "@/i18n/config";
import { absoluteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: { path: string; priority: number }[] = [
    { path: "/", priority: 1 },
    { path: "/product", priority: 0.9 },
    { path: "/features", priority: 0.9 },
    { path: "/demo", priority: 0.9 },
    { path: "/pricing", priority: 0.8 },
    { path: "/solutions", priority: 0.8 },
    ...SOLUTIONS.map((s) => ({ path: `/solutions/${s.slug}`, priority: 0.7 })),
    { path: "/start", priority: 0.8 },
    { path: "/about", priority: 0.5 },
    { path: "/contact", priority: 0.5 },
    { path: "/login", priority: 0.3 },
  ];
  // Every page in both languages, each entry listing its alternate.
  return pages.flatMap((p) =>
    (["en", "ar"] as const).map((l) => ({
      url: absoluteUrl(localePath(l, p.path)),
      changeFrequency: "monthly" as const,
      priority: p.priority,
      alternates: { languages: { en: absoluteUrl(localePath("en", p.path)), ar: absoluteUrl(localePath("ar", p.path)) } },
    })),
  );
}
