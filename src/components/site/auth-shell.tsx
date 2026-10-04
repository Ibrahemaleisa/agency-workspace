import Link from "next/link";
import type { ReactNode } from "react";
import type { Brand } from "@/lib/brand";
import type { Lang } from "@/lib/i18n";
import { BrandLogo } from "./brand";
import { LangSwitch } from "./lang-switch";

/** Centered dark card used by the small public account pages (forgot / reset password). */
export function AuthShell({
  brand,
  lang,
  path,
  title,
  sub,
  children,
}: {
  brand: Brand;
  lang: Lang;
  path: string;
  title: string;
  sub?: string;
  children: ReactNode;
}) {
  return (
    <main className="relative mx-auto flex min-h-screen max-w-sm flex-col px-5 py-6">
      <div className="flex items-center justify-between">
        <Link href="/login">
          <BrandLogo logo={brand.logo} name={brand.name[lang]} />
        </Link>
        <LangSwitch lang={lang} next={path} />
      </div>
      <div className="flex flex-1 items-center py-10">
        <div className="w-full rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl backdrop-blur-xl md:p-8">
          <h1 className="font-display text-2xl font-semibold text-white">{title}</h1>
          {sub && <p className="mt-1.5 text-sm text-zinc-400">{sub}</p>}
          <div className="mt-7">{children}</div>
        </div>
      </div>
    </main>
  );
}

export const authField =
  "block w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none transition focus:border-sand-200/60 focus:bg-white/[0.08] focus:ring-4 focus:ring-sand-200/10";

export const authSubmit =
  "w-full rounded-xl bg-sand-200! py-3 text-base font-semibold text-ink! shadow-none! hover:bg-sand-100!";
