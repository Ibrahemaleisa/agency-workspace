import type { Metadata } from "next";
import { getLang } from "@/lib/lang";
import { legalDoc } from "@/lib/legal";
import { LegalPage } from "@/components/legal-page";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await legalDoc("privacy", await getLang())).title };
}

export default async function PrivacyPage() {
  const lang = await getLang();
  const [doc, other] = await Promise.all([legalDoc("privacy", lang), legalDoc("terms", lang)]);
  return <LegalPage doc={doc} other={{ href: "/terms", label: other.title }} back={{ href: "/", label: lang === "ar" ? "الرئيسية" : "Home" }} />;
}
