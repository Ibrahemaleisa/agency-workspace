import "server-only";
import { headers } from "next/headers";
import type { Organization } from "@/db/schema";
import { createLoginToken } from "./auth";
import { isPlatform, rootDomain, tenantBaseUrl } from "./platform";

/**
 * If the tenant's workspace lives on another host than this request (subdomain or custom domain),
 * returns a URL that signs the user in there with a single-use token. Otherwise null — including
 * single-agency deployments and path routing (/w/{slug}), where every tenant shares this host.
 */
export async function workspaceRedirectUrl(org: Organization, userId: string, next = "/") {
  if (!isPlatform() || (!org.customDomain && !rootDomain())) return null;
  const base = new URL(tenantBaseUrl(org));
  const h = await headers();
  const here = (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(",")[0].trim().toLowerCase();
  if (base.host === here) return null;
  const token = await createLoginToken(userId);
  return `${base.origin}/auth/handoff?token=${encodeURIComponent(token)}&next=${encodeURIComponent(next)}`;
}
