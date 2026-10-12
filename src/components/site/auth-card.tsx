import "@fontsource-variable/alexandria";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { OPERRA_BRAND, brandCss, getBrand, type Brand } from "@/lib/brand";
import { getLang } from "@/lib/lang";
import { isPlatform } from "@/lib/platform";
import type { Lang } from "@/lib/i18n";
import { OperraWordmark } from "../platform/operra-mark";
import { buttonClass, cn } from "../ui";
import { BrandMark } from "./brand";
import { LangSwitch } from "./lang-switch";

/**
 * Frame for every account screen (sign-in, invitation, password reset, email confirmation, setup).
 *
 * - On Operra's own host with no agency yet, it wears the Operra identity (bone, lapis, Alexandria),
 *   the same as sign-up and the preview.
 * - Everywhere else it wears the agency's brand: a panel in the agency's dark colour with its logo,
 *   and a light form side, so a client signing in sees the agency, not us.
 */
export function AuthShell({
  brand,
  lang,
  langNext,
  back,
  panel,
  children,
}: {
  brand: Brand;
  lang: Lang;
  /** Where the language switch returns to. */
  langNext: string;
  /** Optional "back" link shown in the header (e.g. the agency's public page). */
  back?: { href: string; label: string };
  /** Extra content for the brand panel on wide screens (agency mode only). */
  panel?: ReactNode;
  children: ReactNode;
}) {
  const operra = isPlatform() && !brand.orgId;
  const Back = lang === "ar" ? ArrowRight : ArrowLeft;
  const name = brand.name[lang];

  const backLink = back && (
    <Link href={back.href} className="flex items-center gap-1.5 text-sm text-[#5B606B] transition hover:text-[#15171C]">
      <Back aria-hidden className="size-4" /> {back.label}
    </Link>
  );

  if (operra) {
    return (
      <div className="operra-platform min-h-screen bg-[#F7F7F4] text-[#15171C]">
        <style>{`${brandCss(OPERRA_BRAND)} .operra-platform{font-family:"Alexandria Variable",system-ui,sans-serif}`}</style>
        <header className="border-b border-[#E1E2DE]">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
            <Link href={process.env.MARKETING_URL ?? "/"} aria-label="Operra" className="-m-2 p-2">
              <OperraWordmark lang={lang === "ar" ? "ar" : "en"} />
            </Link>
            <LangSwitch lang={lang} next={langNext} tone="light" />
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-md px-4 py-12 sm:px-6 sm:py-16">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F7F7F4] text-zinc-900">
      <style>{brandCss(brand)}</style>
      {/* Brand panel: the agency's own colour and logo. Wide screens only. */}
      <aside className="hidden w-[40%] max-w-xl shrink-0 flex-col justify-between bg-ink p-10 text-white lg:flex xl:p-12">
        <span className="flex items-center gap-3">
          <BrandMark logo={brand.logo} name={name} className="h-10" />
          <span className="text-lg font-semibold tracking-tight">{name}</span>
        </span>
        {panel}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 px-5 py-5 md:px-10">
          <span className="flex items-center gap-2.5 lg:hidden">
            <BrandMark logo={brand.logo} name={name} variant="light" className="h-8" textClass="text-sm" />
            <span className="font-semibold tracking-tight">{name}</span>
          </span>
          <span className="hidden lg:block">{backLink}</span>
          <LangSwitch lang={lang} next={langNext} tone="light" />
        </header>
        <main id="main" className="flex flex-1 items-center justify-center px-5 pt-4 pb-16 md:px-10">
          <div className="w-full max-w-sm">
            {children}
            {back && <div className="mt-8 lg:hidden">{backLink}</div>}
          </div>
        </main>
      </div>
    </div>
  );
}

/** Title + optional sub-line, shared by the account screens. */
export function AuthHeading({ title, sub }: { title: string; sub?: string }) {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-[#15171C]">{title}</h1>
      {sub && <p className="mt-1.5 text-[15px] leading-relaxed text-[#5B606B]">{sub}</p>}
    </>
  );
}

/** A small branded page for the public account pages (verify email, forgot / reset password). */
export async function AuthCard({ title, sub, children, langNext = "/login" }: { title: string; sub?: string; children: ReactNode; langNext?: string }) {
  const [brand, lang] = await Promise.all([getBrand(), getLang()]);
  return (
    <AuthShell brand={brand} lang={lang} langNext={langNext}>
      <AuthHeading title={title} sub={sub} />
      {children}
    </AuthShell>
  );
}

export const authLabel = "mb-1.5 block text-sm font-medium text-[#15171C]";
export const authField =
  "block w-full rounded-lg border border-[#D6D7D2] bg-white px-3.5 py-2.5 text-[15px] text-[#15171C] placeholder:text-[#8D929C] outline-none transition focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/15";
export const authButton = cn(buttonClass("primary"), "w-full py-2.5 text-[15px]");
export const authLink = "text-sm text-[#5B606B] underline underline-offset-4 transition hover:text-[#15171C]";
export const authMuted = "text-sm leading-relaxed text-[#5B606B]";
