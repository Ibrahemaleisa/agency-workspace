"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Ui } from "@/content/en/ui";
import type { Locale } from "./config";

type Ctx = { locale: Locale; ui: Ui };
const LocaleContext = createContext<Ctx | null>(null);

/** Gives client components the locale and the interface strings (set once in the root layout). */
export function LocaleProvider({ locale, ui, children }: Ctx & { children: ReactNode }) {
  return <LocaleContext.Provider value={{ locale, ui }}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale outside LocaleProvider");
  return ctx;
}
