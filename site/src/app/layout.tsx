import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { site } from "@/lib/site";

/*
 * Brand type (all SIL Open Font License, see src/fonts/*-OFL.txt), self-hosted:
 * Instrument Sans for display and UI, IBM Plex Mono for labels and data,
 * IBM Plex Sans Arabic for Arabic.
 */
const instrument = localFont({
  src: "../fonts/instrument-sans-latin-wght-normal.woff2",
  weight: "400 700",
  style: "normal",
  variable: "--font-instrument",
  display: "swap",
  adjustFontFallback: "Arial",
});

const plexMono = localFont({
  src: [
    { path: "../fonts/ibm-plex-mono-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../fonts/ibm-plex-mono-latin-500-normal.woff2", weight: "500", style: "normal" },
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
    { path: "../fonts/ibm-plex-sans-arabic-arabic-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../fonts/ibm-plex-sans-arabic-arabic-600-normal.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-plex-arabic",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — ${site.descriptor}`, template: `%s · ${site.name}` },
  description: site.description,
  applicationName: site.name,
  openGraph: {
    type: "website",
    siteName: site.name,
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    url: "/",
    locale: "en_US",
  },
  twitter: { card: "summary_large_image", title: `${site.name} — ${site.tagline}`, description: site.description },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: "#f6f6f3",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" dir="ltr" className={`${instrument.variable} ${plexMono.variable} ${plexArabic.variable} antialiased`}>
      <body className="min-h-dvh">
        <SiteHeader />
        <main id="main" tabIndex={-1} className="focus:outline-none">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
