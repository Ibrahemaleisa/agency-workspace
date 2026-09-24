import type { Metadata, Viewport } from "next";
import "@fontsource-variable/dm-sans";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "@fontsource/ibm-plex-sans-arabic/700.css";
import { getLang } from "@/lib/lang";
import { brandCss, getBrand } from "@/lib/brand";
import { dirOf } from "@/lib/i18n";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const [brand, lang] = await Promise.all([getBrand(), getLang()]);
  const name = brand.name[lang];
  return {
    title: { default: name, template: `%s · ${name}` },
    description: name,
  };
}

export async function generateViewport(): Promise<Viewport> {
  return { themeColor: (await getBrand()).primary };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [lang, brand] = await Promise.all([getLang(), getBrand()]);
  return (
    <html lang={lang} dir={dirOf(lang)} className="h-full antialiased">
      <head>
        {/* The agency's colours re-tint the whole interface (see lib/brand.ts). */}
        <style id="brand-theme">{brandCss(brand)}</style>
      </head>
      <body className="min-h-full text-zinc-900">{children}</body>
    </html>
  );
}
