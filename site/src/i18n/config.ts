/** Locales of the marketing site. English lives at `/`, Arabic at `/ar`. Client-safe. */
export const LOCALES = ["en", "ar"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const isLocale = (v: unknown): v is Locale => v === "en" || v === "ar";
export const dirOf = (l: Locale) => (l === "ar" ? "rtl" : "ltr");

/** "/pricing" → "/pricing" (en) or "/ar/pricing" (ar). Leaves absolute URLs and #anchors alone. */
export function localePath(locale: Locale, path: string) {
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  if (locale === DEFAULT_LOCALE) return path;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

/**
 * The path without its locale prefix: "/ar/pricing" → "/pricing". Also strips "/en", which is what
 * usePathname() reports while rendering on the server (English is served by rewriting to /en).
 */
export const barePath = (pathname: string) => pathname.replace(/^\/(?:ar|en)(?=\/|$)/, "") || "/";

/** The same page in the other language: "/ar/pricing" ↔ "/pricing". */
export const switchLocalePath = (pathname: string, to: Locale) => localePath(to, barePath(pathname));
