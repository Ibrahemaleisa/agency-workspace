import "server-only";
import { cache } from "react";
import { createHash } from "node:crypto";
import type { Organization } from "@/db/schema";
import { getCurrentUser } from "./auth";
import { getOrgById, getPublicTenant } from "./tenant";
import { isPlatform } from "./platform";
import type { Lang } from "./i18n";

/**
 * White-label brand of the current tenant (see getBrand for how the tenant is resolved).
 * Everything visual — name, logo, colors, landing page, default language — comes from here,
 * and is edited by the agency's admin on Settings → Brand.
 */
export type Brand = {
  orgId: string | null;
  name: { en: string; ar: string };
  /** URL of the uploaded logo (/brand-logo/{orgId}, cache-busted by content), or null. */
  logo: string | null;
  primary: string;
  accent: string;
  defaultLang: Lang;
  showLanding: boolean;
  contactEmail: string;
  whatsapp: string;
  social: { instagram: string; x: string; linkedin: string };
  showcaseClients: string[];
};

export const DEFAULT_BRAND: Brand = {
  orgId: null,
  name: { en: "Agency", ar: "الوكالة" },
  logo: null,
  primary: "#0a0a0a",
  accent: "#e8dcc8",
  defaultLang: "ar",
  showLanding: true,
  contactEmail: "",
  whatsapp: "",
  social: { instagram: "", x: "", linkedin: "" },
  showcaseClients: [],
};

export const HEX = /^#[0-9a-f]{6}$/i;

/** Operra's own look, used on platform pages (sign-up, preview, control center) and as the fallback. */
export const OPERRA_BRAND: Brand = {
  ...DEFAULT_BRAND,
  name: { en: "Operra", ar: "أوبيرّا" },
  primary: "#1F3FBF",
  accent: "#E3E8FC",
  defaultLang: "en",
  showLanding: false,
};

export function orgBrand(org: Organization): Brand {
  return {
    orgId: org.id,
    name: { en: org.name, ar: org.nameAr || org.name },
    // Pages link to the logo instead of inlining its data URL (up to 300 KB) into every page.
    logo: org.logo ? `/brand-logo/${org.id}?v=${createHash("sha1").update(org.logo).digest("hex").slice(0, 12)}` : null,
    primary: HEX.test(org.primaryColor) ? org.primaryColor : DEFAULT_BRAND.primary,
    accent: HEX.test(org.accentColor) ? org.accentColor : DEFAULT_BRAND.accent,
    defaultLang: org.defaultLang === "en" ? "en" : "ar",
    showLanding: org.showLanding,
    contactEmail: org.contactEmail ?? "",
    whatsapp: org.whatsapp ?? "",
    social: { instagram: org.instagram ?? "", x: org.xHandle ?? "", linkedin: org.linkedin ?? "" },
    showcaseClients: org.showcaseClients ?? [],
  };
}

/** A workspace's logo as stored (a data: URL), for /brand-logo and the tab icon. */
export async function getLogoDataUrl(orgId: string | null): Promise<string | null> {
  if (!orgId) return null;
  return (await getOrgById(orgId))?.logo ?? null;
}

/**
 * Brand for this request: the signed-in user's tenant, else the tenant named by the host
 * (or /w/{slug}), else the only agency of a single-agency deployment, else Operra's own.
 */
export const getBrand = cache(async (): Promise<Brand> => {
  const user = await getCurrentUser().catch(() => null);
  const org = user ? await getOrgById(user.orgId) : await getPublicTenant().catch(() => null);
  if (!org) return isPlatform() ? OPERRA_BRAND : DEFAULT_BRAND;
  return orgBrand(org);
});

export { brandCss, brandVars } from "./brand-css";

/** Replace the {brand} placeholder in copy with the agency's name. */
export function withBrand<T>(value: T, name: string): T {
  if (typeof value === "string") return value.replaceAll("{brand}", name) as T;
  if (Array.isArray(value)) return value.map((v) => withBrand(v, name)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, withBrand(v, name)])) as T;
  }
  return value;
}
