import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import "../globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { VisitTracker } from "@/components/visit-tracker";
import { CONTENT } from "@/content";
import { LOCALES, dirOf, isLocale } from "@/i18n/config";
import { LocaleProvider } from "@/i18n/provider";
import { OG_IMAGES } from "@/lib/metadata";
import { site } from "@/lib/site";

/*
 * Brand type: Alexandria (SIL Open Font License, see src/fonts/Alexandria-OFL.txt), self-hosted.
 * One family drawn for Arabic and Latin together, so both languages read as one voice.
 * Two files split by script; the browser takes each glyph from whichever file has it.
 */
const alexLatin = localFont({
  src: "../../fonts/alexandria-latin-wght-normal.woff2",
  weight: "300 800",
  style: "normal",
  variable: "--font-alex-latin",
  display: "swap",
  adjustFontFallback: "Arial",
});

const alexArabic = localFont({
  src: "../../fonts/alexandria-arabic-wght-normal.woff2",
  weight: "300 800",
  style: "normal",
  variable: "--font-alex-arabic",
  display: "swap",
  adjustFontFallback: "Arial",
});

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  const ar = lang === "ar";
  const descriptor = ar ? site.descriptorAr : site.descriptor;
  const tagline = ar ? site.taglineAr : site.tagline;
  const description = ar ? site.descriptionAr : site.description;
  return {
    metadataBase: new URL(site.url),
    title: { default: `${site.name} — ${descriptor}`, template: `%s · ${site.name}` },
    description,
    applicationName: site.name,
    openGraph: {
      type: "website",
      siteName: site.name,
      title: `${site.name} — ${tagline}`,
      description,
      url: ar ? "/ar" : "/",
      locale: ar ? "ar_SA" : "en_US",
      alternateLocale: ar ? "en_US" : "ar_SA",
      images: OG_IMAGES,
    },
    twitter: { card: "summary_large_image", title: `${site.name} — ${tagline}`, description, images: OG_IMAGES },
    robots: { index: true, follow: true },
    formatDetection: { telephone: false, email: false, address: false },
  };
}

export const viewport: Viewport = {
  themeColor: "#f7f7f4",
  colorScheme: "light",
};

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <html lang={lang} dir={dirOf(lang)} className={`${alexLatin.variable} ${alexArabic.variable} antialiased`}>
      <body className="min-h-dvh">
        <LocaleProvider locale={lang} ui={CONTENT[lang].UI}>
          <SiteHeader nav={CONTENT[lang].MAIN_NAV} mobileNav={CONTENT[lang].MOBILE_NAV} />
          <main id="main" tabIndex={-1} className="focus:outline-none">
            {children}
          </main>
          <SiteFooter />
          <VisitTracker lang={lang} />
        </LocaleProvider>
      </body>
    </html>
  );
}
