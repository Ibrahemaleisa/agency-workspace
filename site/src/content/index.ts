import * as en from "./en";
import * as ar from "./ar";
import type { Locale } from "@/i18n/config";

/** All site copy per locale. Arabic modules are typed against the English ones, so shapes can't drift. */
export type Content = typeof en;
export const CONTENT: Record<Locale, Content> = { en, ar };
