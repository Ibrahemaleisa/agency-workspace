import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "apm_session";
const TENANT_HINT_COOKIE = "operra_tenant";

/** Routes anyone may open without a session. */
const PUBLIC = [
  /^\/login$/,
  /^\/welcome$/,
  /^\/setup$/,
  /^\/lang$/,
  /^\/signup(\/|$)/,
  /^\/preview(\/|$)/,
  /^\/invite\//,
  /^\/auth\//,
  /^\/operra(\/|$)/, // Operra control center (its own sign-in)
  /^\/billing\/test-checkout$/,
  /^\/api\/billing\/webhook$/,
  /^\/api\/cron\//,
  /^\/api\/health$/,
];

/**
 * Cheap gate based on cookies (full validation happens server-side):
 * - /w/{slug}[/path] is a tenant's branded entry in path-routing mode: remember the tenant
 *   (branding hint only — never used for authorization) and continue without the prefix;
 * - "/" shows the tenant's public landing page to visitors and the dashboard to signed-in users;
 * - every other app route bounces visitors to /login.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const tenantPath = pathname.match(/^\/w\/([a-z0-9-]{2,40})(\/.*)?$/);
  if (tenantPath) {
    const url = request.nextUrl.clone();
    url.pathname = tenantPath[2] && tenantPath[2] !== "/" ? tenantPath[2] : "/";
    const res = NextResponse.redirect(url);
    res.cookies.set(TENANT_HINT_COOKIE, tenantPath[1], { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
    return res;
  }

  if (request.cookies.has(SESSION_COOKIE) || PUBLIC.some((re) => re.test(pathname))) {
    // Let layouts know the path (e.g. a locked workspace still opens its billing page).
    const headers = new Headers(request.headers);
    headers.set("x-pathname", pathname);
    return NextResponse.next({ request: { headers } });
  }

  const url = request.nextUrl.clone();
  if (pathname === "/") {
    url.pathname = "/welcome";
    return NextResponse.rewrite(url);
  }
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  // Everything except static assets and metadata files.
  matcher: ["/((?!_next/static|_next/image|icon|apple-icon|favicon.ico).*)"],
};
