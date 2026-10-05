import "@fontsource-variable/alexandria";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OPERRA_BRAND, brandCss } from "@/lib/brand";
import { getLang } from "@/lib/lang";
import { isPlatform } from "@/lib/platform";
import { LangSwitch } from "@/components/site/lang-switch";
import { OperraWordmark } from "@/components/platform/operra-mark";

/**
 * Operra's own pages (sign-up, preview, test checkout). They always wear the Operra identity —
 * bone, graphite, lapis and Alexandria (BRAND.md), whatever tenant the visitor last saw.
 */
export default async function PlatformLayout({ children }: LayoutProps<"/">) {
  if (!isPlatform()) notFound();
  const lang = await getLang();
  const marketing = process.env.MARKETING_URL ?? "/login";
  return (
    <div className="operra-platform min-h-screen bg-[#F7F7F4] text-[#15171C]">
      <style>{`${brandCss(OPERRA_BRAND)} .operra-platform{font-family:"Alexandria Variable",system-ui,sans-serif} .operra-platform .font-mono{font-family:inherit;font-variant-numeric:tabular-nums}`}</style>
      <header className="border-b border-[#E1E2DE]">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href={marketing} aria-label="Operra" className="-m-2 p-2">
            <OperraWordmark lang={lang === "ar" ? "ar" : "en"} />
          </Link>
          <LangSwitch lang={lang} next="/signup" tone="light" />
        </div>
      </header>
      <main id="main">{children}</main>
    </div>
  );
}
