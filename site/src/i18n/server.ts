import { lang } from "next/root-params";
import { notFound } from "next/navigation";
import { CONTENT, type Content } from "@/content";
import { isLocale, type Locale } from "./config";

/** The page's locale, from the root `[lang]` segment (server components only). */
export async function getLocale(): Promise<Locale> {
  const l = await lang();
  if (!isLocale(l)) notFound();
  return l;
}

/** All copy for the current locale. */
export async function getContent(): Promise<Content & { locale: Locale }> {
  const locale = await getLocale();
  return { ...CONTENT[locale], locale };
}
