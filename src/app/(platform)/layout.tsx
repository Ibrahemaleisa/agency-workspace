import "@fontsource-variable/instrument-sans";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OPERRA_BRAND, brandCss } from "@/lib/brand";
import { getLang } from "@/lib/lang";
import { isPlatform } from "@/lib/platform";
import { LangSwitch } from "@/components/site/lang-switch";
import { OperraWordmark } from "@/components/platform/operra-mark";

/**
 * Operra's own pages (sign-up, preview, test checkout). They always wear the Operra identity —
 * paper, ink, one signal orange, Instrument Sans — whatever tenant the visitor last saw.
 */
export default async function PlatformLayout({ children }: LayoutProps<"/">) {
  if (!isPlatform()) notFound();
  const lang = await getLang();
  const marketing = process.env.MARKETING_URL ?? "/login";
  return (
    <div className="operra-platform min-h-screen bg-[#F6F6F3] text-[#0B0D10]">
      <style>{`${brandCss(OPERRA_BRAND)} .operra-platform{font-family:"Instrument Sans Variable","IBM Plex Sans Arabic",system-ui,sans-serif}`}</style>
      <header className="border-b border-[#E3E4E0]">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href={marketing} aria-label="Operra" className="-m-2 p-2">
            <OperraWordmark />
          </Link>
          <LangSwitch lang={lang} next="/signup" tone="light" />
        </div>
      </header>
      <main id="main">{children}</main>
    </div>
  );
}
