import "server-only";
import { cache } from "react";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import type { Lang } from "./i18n";

/**
 * White-label brand for this deployment (one agency per deployment).
 * Everything visual — name, logo, colors, landing page, default language — comes from here,
 * and is edited by the agency's admin on Settings → Brand.
 */
export type Brand = {
  orgId: string | null;
  name: { en: string; ar: string };
  logo: string | null;
  primary: string;
  accent: string;
  defaultLang: Lang;
  showLanding: boolean;
  contactEmail: string;
  whatsapp: string;
  social: { instagram: string; x: string; linkedin: string };
  showcaseClients: string[];
};

export const DEFAULT_BRAND: Brand = {
  orgId: null,
  name: { en: "Agency", ar: "الوكالة" },
  logo: null,
  primary: "#0a0a0a",
  accent: "#e8dcc8",
  defaultLang: "ar",
  showLanding: true,
  contactEmail: "",
  whatsapp: "",
  social: { instagram: "", x: "", linkedin: "" },
  showcaseClients: [],
};

export const HEX = /^#[0-9a-f]{6}$/i;

export const getBrand = cache(async (): Promise<Brand> => {
  const org = await db.query.organizations
    .findFirst({ orderBy: asc(organizations.createdAt) })
    .catch(() => undefined);
  if (!org) return DEFAULT_BRAND;
  return {
    orgId: org.id,
    name: { en: org.name, ar: org.nameAr || org.name },
    logo: org.logo,
    primary: HEX.test(org.primaryColor) ? org.primaryColor : DEFAULT_BRAND.primary,
    accent: HEX.test(org.accentColor) ? org.accentColor : DEFAULT_BRAND.accent,
    defaultLang: org.defaultLang === "en" ? "en" : "ar",
    showLanding: org.showLanding,
    contactEmail: org.contactEmail ?? "",
    whatsapp: org.whatsapp ?? "",
    social: { instagram: org.instagram ?? "", x: org.xHandle ?? "", linkedin: org.linkedin ?? "" },
    showcaseClients: org.showcaseClients ?? [],
  };
});

/**
 * CSS that re-tints the whole interface from two brand colors.
 * Tailwind utilities read these variables, so every bg-ink / text-sand-200 / indigo-600 follows the brand.
 * `accent` is the light highlight colour, `primary` the dark one (sidebar, buttons, landing page).
 */
export function brandCss(b: Pick<Brand, "primary" | "accent">) {
  const A = b.accent;
  const P = b.primary;
  const mixW = (c: string, pct: number) => `color-mix(in oklab, ${c} ${pct}%, white)`;
  const mixB = (c: string, pct: number) => `color-mix(in oklab, ${c} ${pct}%, black)`;
  const sand: Record<number, string> = {
    50: mixW(A, 22), 100: mixW(A, 50), 200: A, 300: mixB(A, 92), 400: mixB(A, 82), 500: mixB(A, 70),
    600: mixB(A, 57), 700: mixB(A, 44), 800: mixB(A, 31), 900: mixB(A, 19), 950: mixB(A, 11),
  };
  const indigo: Record<number, string> = {
    50: mixW(A, 25), 100: mixW(A, 45), 200: mixW(A, 70), 300: mixB(A, 94),
    400: `color-mix(in oklab, ${A} 45%, ${P})`, 500: mixW(P, 78), 600: P, 700: mixB(P, 85),
    800: mixB(P, 72), 900: mixB(P, 60), 950: mixB(P, 45),
  };
  const vars = [
    `--color-ink:${P}`,
    `--brand-primary:${P}`,
    `--brand-accent:${A}`,
    ...Object.entries(sand).flatMap(([k, v]) => [`--color-sand-${k}:${v}`, `--color-violet-${k}:${v}`]),
    ...Object.entries(indigo).map(([k, v]) => `--color-indigo-${k}:${v}`),
  ];
  // `html:root` outranks Tailwind's own `:root` theme block regardless of stylesheet order.
  return `html:root{${vars.join(";")}}`;
}

/** Replace the {brand} placeholder in copy with the agency's name. */
export function withBrand<T>(value: T, name: string): T {
  if (typeof value === "string") return value.replaceAll("{brand}", name) as T;
  if (Array.isArray(value)) return value.map((v) => withBrand(v, name)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, withBrand(v, name)])) as T;
  }
  return value;
}
