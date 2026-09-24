"use client";

import Link from "next/link";
import { APP_DICT } from "@/lib/i18n-app";
import { isLang } from "@/lib/i18n";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  // Client-only boundary: read the language from <html lang>.
  const lang = typeof document !== "undefined" && isLang(document.documentElement.lang) ? document.documentElement.lang : "ar";
  const t = APP_DICT[lang].errors;
  return (
    <div className="mx-auto max-w-md rounded-xl border border-zinc-200/80 bg-white p-6 text-center">
      <h2 className="text-base font-semibold">{t.title}</h2>
      <p className="mt-2 text-sm text-zinc-500">{error.message || t.generic}</p>
      <div className="mt-4 flex justify-center gap-2">
        <button onClick={reset} className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white">
          {t.tryAgain}
        </button>
        <Link href="/" className="rounded-md px-3 py-1.5 text-sm font-medium ring-1 ring-zinc-300">
          {APP_DICT[lang].nav.dashboard}
        </Link>
      </div>
    </div>
  );
}
