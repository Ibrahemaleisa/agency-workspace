import type { ReactNode } from "react";
import { brandCss, getBrand } from "@/lib/brand";
import { getLang } from "@/lib/lang";
import { BrandLogo } from "./brand";

/** A small branded card for the public account pages (verify email, forgot / reset password). */
export async function AuthCard({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  const [brand, lang] = await Promise.all([getBrand(), getLang()]);
  return (
    <>
      <style>{brandCss(brand)}</style>
      <main className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-8">
        <BrandLogo logo={brand.logo} name={brand.name[lang]} />
        <div className="flex flex-1 flex-col justify-center py-10">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl md:p-8">
            <h1 className="font-display text-2xl font-semibold text-white">{title}</h1>
            {sub && <p className="mt-1.5 text-sm text-zinc-400">{sub}</p>}
            {children}
          </div>
        </div>
      </main>
    </>
  );
}

export const authField =
  "block w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none transition focus:border-sand-200/60 focus:bg-white/[0.08] focus:ring-4 focus:ring-sand-200/10";
export const authButton = "w-full rounded-xl bg-sand-200! py-3 text-base font-semibold text-ink! shadow-none! hover:bg-sand-100!";
