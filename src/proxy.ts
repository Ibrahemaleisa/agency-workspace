import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "apm_session";

/** Routes anyone may open without a session. */
const PUBLIC = [
  /^\/login$/,
  /^\/(forgot|reset)-password$/,
  /^\/welcome$/,
  /^\/(terms|privacy)$/,
  /^\/setup$/,
  /^\/lang$/,
  /^\/brand-logo\//, // agency logos (public, like the sign-in page that shows them)
  /^\/invite\//,
  /^\/api\/cron\//,
  /^\/api\/health$/,
  /^\/api\/calendar\/[A-Za-z0-9_.-]+$/, // private calendar feeds (the secret in the URL is the credential)
];

/**
 * Cheap gate based on cookies (full validation happens server-side):
 * - /w/{slug}[/path] (old agency links) continue without the prefix;
 * - "/" shows the agency's public landing page to visitors and the dashboard to signed-in users;
 * - every other app route bounces visitors to /login.
 */
export function proxy(request: NextRequest) {
  return route(request);
}

/**
 * Content-Security-Policy with a fresh nonce per request. Next.js reads the nonce from the request's
 * CSP header and puts it on its own scripts; any other script (injected through a bug) won't run.
 * Styles stay 'unsafe-inline' (the brand theme and style attributes); they can't run code.
 */
function contentSecurityPolicy(nonce: string) {
  const dev = process.env.NODE_ENV === "development";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    // Large files go straight from the browser to the file store.
    "connect-src 'self' https://vercel.com https://*.blob.vercel-storage.com",
    "media-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(dev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

function route(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Old agency links (/w/{slug}[/path]) keep working: the agency name in the link is simply dropped.
  const tenantPath = pathname.match(/^\/w\/([a-z0-9-]{2,40})(\/.*)?$/);
  if (tenantPath) {
    const url = request.nextUrl.clone();
    url.pathname = tenantPath[2] && tenantPath[2] !== "/" ? tenantPath[2] : "/login";
    return NextResponse.redirect(url);
  }

  if (request.cookies.has(SESSION_COOKIE) || PUBLIC.some((re) => re.test(pathname))) {
    return withCsp(new Headers(request.headers), (h) => NextResponse.next({ request: { headers: h } }));
  }

  const url = request.nextUrl.clone();
  if (pathname === "/") {
    url.pathname = "/welcome";
    return withCsp(new Headers(request.headers), (h) => NextResponse.rewrite(url, { request: { headers: h } }));
  }
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

/** Adds the nonce CSP to the request (for Next.js to read) and to the response (for the browser). */
function withCsp(headers: Headers, respond: (h: Headers) => NextResponse) {
  const csp = contentSecurityPolicy(btoa(crypto.randomUUID()));
  headers.set("Content-Security-Policy", csp);
  const res = respond(headers);
  res.headers.set("Content-Security-Policy", csp);
  return res;
}

export const config = {
  // Everything except static assets and metadata files.
  matcher: ["/((?!_next/static|_next/image|icon|apple-icon|favicon.ico).*)"],
};
