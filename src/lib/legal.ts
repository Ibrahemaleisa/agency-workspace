import "server-only";
import { LEGAL, type LegalDoc } from "@/content/legal";
import type { Lang } from "./i18n";
import { getBrand } from "./brand";

/** Version of the terms people accept at sign-up (bump when they change materially). */
export const TERMS_VERSION = process.env.LEGAL_EFFECTIVE_DATE ?? "2026-10-12";

/** The Terms of Service or Privacy Policy in a language, with this deployment's details filled in. */
export async function legalDoc(kind: "terms" | "privacy", lang: Lang): Promise<LegalDoc> {
  const brand = await getBrand();
  const operator =
    process.env.LEGAL_ENTITY_NAME?.trim() || brand.name[lang];
  const email = process.env.LEGAL_CONTACT_EMAIL?.trim() || process.env.EMAIL_FROM?.replace(/^.*<|>.*$/g, "") || brand.contactEmail || "—";
  const jurisdiction =
    process.env.LEGAL_JURISDICTION?.trim() || (lang === "ar" ? "المملكة العربية السعودية" : "the Kingdom of Saudi Arabia");
  const fill = (s: string) =>
    s.replaceAll("{operator}", operator).replaceAll("{email}", email).replaceAll("{jurisdiction}", jurisdiction).replaceAll("{effective}", TERMS_VERSION);
  const doc = LEGAL[kind][lang];
  return {
    title: fill(doc.title),
    updated: fill(doc.updated),
    intro: fill(doc.intro),
    sections: doc.sections.map((s) => ({ title: fill(s.title), body: s.body.map(fill) })),
  };
}
