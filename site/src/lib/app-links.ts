import { localePath, type Locale } from "@/i18n/config";
import { site } from "./site";

/**
 * The Operra app (NEXT_PUBLIC_APP_URL, e.g. https://app.operra.com): self-serve sign-up, the
 * read-only demo preview and sign-in. When it isn't set, the site falls back to the trial request
 * form and the legacy demo deployment. Links pass through the app's /lang so the visitor keeps
 * their language.
 */
export const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");

const inApp = (locale: Locale, next: string) => `${appUrl}/lang?to=${locale}&next=${encodeURIComponent(next)}`;

export function appLinks(locale: Locale) {
  return {
    /** Primary conversion: create a workspace (or request one). */
    trial: appUrl ? inApp(locale, "/signup?plan=workspace") : localePath(locale, "/start"),
    /** Step inside the demo agency: the app's preview, or the legacy shared demo (new tab). */
    demo: appUrl ? inApp(locale, "/preview") : site.demoUrl,
    demoIsExternal: !appUrl,
    /** Central sign-in on the app; null without an app URL. */
    login: appUrl ? inApp(locale, "/login") : null,
  };
}
