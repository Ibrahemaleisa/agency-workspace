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
 * Brand type (all SIL Open Font License, see src/fonts/*-OFL.txt), self-hosted:
 * Instrument Sans for display and UI, IBM Plex Mono for labels and data,
 * IBM Plex Sans Arabic for Arabic.
 */
const instrument = localFont({
  src: "../../fonts/instrument-sans-latin-wght-normal.woff2",
  weight: "400 700",
  style: "normal",
  variable: "--font-instrument",
  display: "swap",
  adjustFontFallback: "Arial",
});

const plexMono = localFont({
  src: [
    { path: "../../fonts/ibm-plex-mono-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../fonts/ibm-plex-mono-latin-500-normal.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-plex-mono",
  display: "swap",
  // Labels only — not worth competing with the headline font for early bandwidth.
  preload: false,
  adjustFontFallback: false,
  fallback: ["ui-monospace", "SF Mono", "Consolas", "monospace"],
});

const plexArabic = localFont({
  src: [
    { path: "../../fonts/ibm-plex-sans-arabic-arabic-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../fonts/ibm-plex-sans-arabic-arabic-600-normal.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-plex-arabic",
  display: "swap",
  // Only requested on pages that render Arabic text (unicode-range), so no preload.
  preload: false,
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
  themeColor: "#f6f6f3",
  colorScheme: "light",
};

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <html lang={lang} dir={dirOf(lang)} className={`${instrument.variable} ${plexMono.variable} ${plexArabic.variable} antialiased`}>
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
