import type { MetadataRoute } from "next";
import { SOLUTIONS } from "@/content/solutions";
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
  return pages.map((p) => ({ url: absoluteUrl(p.path), changeFrequency: "monthly", priority: p.priority }));
}
