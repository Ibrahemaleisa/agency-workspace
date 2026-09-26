import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { organizations, type Organization } from "@/db/schema";
import { RESERVED_SLUGS, appUrl, isPlatform, rootDomain } from "./platform";

/** Branding hint set by /w/{slug} in path-routing mode. Never used for authorization. */
export const TENANT_HINT_COOKIE = "operra_tenant";

function requestHost(h: Headers) {
  return (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(",")[0].trim().toLowerCase().replace(/:\d+$/, "");
}

const bySlug = (slug: string) => db.query.organizations.findFirst({ where: eq(organizations.slug, slug) });

/**
 * The tenant named by the request's host: {slug}.APP_ROOT_DOMAIN or a verified custom domain.
 * This is authoritative — a session from another tenant is rejected on this host.
 */
export const getHostTenant = cache(async (): Promise<Organization | null> => {
  const host = requestHost(await headers());
  if (!host) return null;
  const root = rootDomain();
  if (root && host.endsWith(`.${root}`)) {
    const sub = host.slice(0, -(root.length + 1));
    if (!sub || sub.includes(".") || RESERVED_SLUGS.has(sub)) return null;
    return (await bySlug(sub)) ?? null;
  }
  const appHost = new URL(appUrl()).hostname;
  if (!isPlatform() || host === appHost || host === root || host === "localhost" || host.endsWith(".vercel.app")) return null;
  return (await db.query.organizations.findFirst({ where: eq(organizations.customDomain, host) })) ?? null;
});

/** True when this request is on a tenant's own host (subdomain / custom domain). */
export async function isTenantHost() {
  return !!(await getHostTenant());
}

/**
 * The tenant for public pages (landing, sign-in, lead form, invitations) before anyone is signed in:
 * host tenant → /w/{slug} hint → the only agency in a single-agency deployment.
 */
export const getPublicTenant = cache(async (): Promise<Organization | null> => {
  const host = await getHostTenant();
  if (host) return host;
  if (isPlatform()) {
    const hint = (await cookies()).get(TENANT_HINT_COOKIE)?.value;
    if (hint) {
      const org = await bySlug(hint);
      if (org && !org.isDemo) return org;
    }
    return null;
  }
  const slug = process.env.SITE_ORG_SLUG;
  return (
    (await db.query.organizations.findFirst({
      where: slug ? eq(organizations.slug, slug) : undefined,
      orderBy: asc(organizations.createdAt),
    })) ?? null
  );
});

export const getOrgById = cache(async (id: string) => db.query.organizations.findFirst({ where: eq(organizations.id, id) }));

/**
 * Path routing: after signing in on the shared app host, remember the tenant as the branding hint so
 * signing out lands on that agency's own sign-in page. (Server actions / route handlers only.)
 */
export async function rememberTenant(org: Organization) {
  if (!isPlatform() || org.isDemo || (await getHostTenant())) return;
  (await cookies()).set(TENANT_HINT_COOKIE, org.slug, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
}
