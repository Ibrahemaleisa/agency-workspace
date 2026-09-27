import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Organization, User } from "@/db/schema";
import { createLoginToken, createSession } from "./auth";
import { isPlatform, rootDomain, tenantBaseUrl } from "./platform";
import { sign, verify } from "./secret";
import { rememberTenant } from "./tenant";

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

/**
 * Signs a membership in and takes them to their workspace: a handoff to the tenant's own host when
 * it has one, otherwise a session on this host (remembering the tenant for branding).
 */
export async function enterWorkspace(user: User, org: Organization, next = "/"): Promise<never> {
  const target = await workspaceRedirectUrl(org, user.id, next);
  if (target) redirect(target);
  await rememberTenant(org);
  await createSession(user.id);
  redirect(next);
}

/* Choosing an agency after sign-in, for people who belong to more than one. */
const CHOOSER_COOKIE = "operra_choose";

/** After a successful password check: remember who signed in (signed, 10 minutes) and ask which agency. */
export async function startChooser(accountId: string): Promise<never> {
  (await cookies()).set(CHOOSER_COOKIE, sign({ accountId }, 600), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  redirect("/login/choose");
}

/** The account that just proved its password on this browser, or null. */
export async function chooserAccount(): Promise<string | null> {
  const token = (await cookies()).get(CHOOSER_COOKIE)?.value;
  return token ? (verify<{ accountId: string }>(token)?.accountId ?? null) : null;
}

export async function endChooser() {
  (await cookies()).delete(CHOOSER_COOKIE);
}
