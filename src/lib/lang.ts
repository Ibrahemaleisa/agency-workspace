import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { ar as arLocale, enUS } from "date-fns/locale";
import { DICT, LANG_COOKIE, dirOf, isLang, type Lang } from "./i18n";
import { APP_DICT } from "./i18n-app";
import { getBrand, withBrand } from "./brand";

/** Visitor's chosen language (the agency's default language until they pick one). */
export const getLang = cache(async (): Promise<Lang> => {
  const v = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(v) ? v : (await getBrand()).defaultLang;
});

/** Public-site copy (landing + sign-in), with the agency's name filled in. */
export const getDict = cache(async () => {
  const [lang, brand] = await Promise.all([getLang(), getBrand()]);
  return { lang, brand, t: withBrand(DICT[lang], brand.name[lang]) };
});

/** In-app copy, date locale and text direction for the current request. */
export const getT = cache(async () => {
  const [lang, brand] = await Promise.all([getLang(), getBrand()]);
  return {
    lang,
    brand,
    t: withBrand(APP_DICT[lang], brand.name[lang]),
    locale: lang === "ar" ? arLocale : enUS,
    dir: dirOf(lang),
  };
});
