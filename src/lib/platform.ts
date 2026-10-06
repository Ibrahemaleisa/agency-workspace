/**
 * Deployment mode.
 *
 * - Platform mode (OPERRA_PLATFORM=true): one multi-tenant Operra app. Agencies sign up, get a
 *   provisioned tenant with its own serial, subdomain (or /w/{slug}) and branding.
 * - Single-agency mode (default): the original white-label deployment — one agency per database,
 *   first-run /setup screen. Existing customer deployments keep working unchanged.
 */
export const isPlatform = () => process.env.OPERRA_PLATFORM === "true";

/**
 * The shared public demo of a single-agency deployment (SHOW_DEMO_ACCOUNTS=true lists the demo
 * logins on the sign-in page). Visitors share those accounts, so credentials are read-only there.
 */
export const isSharedDemo = () => !isPlatform() && process.env.SHOW_DEMO_ACCOUNTS === "true";

/** Public base URL of the app (sign-up, preview, platform pages, path-based tenant entry). */
export function appUrl() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

/**
 * Parent domain for tenant subdomains, e.g. "operra.app" → acme.operra.app.
 * Requires a wildcard DNS record and wildcard domain on the hosting project. Unset → path routing (/w/acme).
 */
export const rootDomain = () => process.env.APP_ROOT_DOMAIN?.trim().toLowerCase() || null;

/** Subdomains and slugs that can never be a tenant. */
export const RESERVED_SLUGS = new Set([
  "app", "www", "admin", "api", "operra", "demo", "preview", "mail", "email", "smtp", "static", "assets",
  "cdn", "status", "help", "support", "docs", "blog", "w", "billing", "signup", "login", "auth", "invite",
  "settings", "dashboard", "ar", "en", "root", "system", "test", "staging", "dev",
]);

export const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/;

export function slugify(input: string) {
  return (
    input
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || ""
  );
}

type TenantLike = { slug: string; customDomain: string | null };

/** Where a tenant's app pages live (email links, redirects after sign-in). */
export function tenantBaseUrl(t: TenantLike) {
  const app = new URL(appUrl());
  if (t.customDomain) return `https://${t.customDomain}`;
  const root = rootDomain();
  if (root) return `${app.protocol}//${t.slug}.${root}${app.port ? `:${app.port}` : ""}`;
  return appUrl();
}

/** The address a tenant's people bookmark: their branded entry page. */
export function tenantEntryUrl(t: TenantLike) {
  if (t.customDomain || rootDomain()) return tenantBaseUrl(t);
  return `${appUrl()}/w/${t.slug}`;
}
