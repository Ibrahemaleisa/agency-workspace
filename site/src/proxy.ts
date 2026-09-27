import { NextResponse, type NextRequest } from "next/server";

/**
 * Locale routing. English is served at `/` (internally `/en/...`), Arabic at `/ar/...`.
 * `/en/...` itself redirects to the unprefixed URL so every page has one canonical address.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === "/ar" || pathname.startsWith("/ar/")) return NextResponse.next();

  if (pathname === "/en" || pathname.startsWith("/en/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url, 308);
  }

  const url = request.nextUrl.clone();
  url.pathname = `/en${pathname === "/" ? "" : pathname}`;
  url.search = search;
  return NextResponse.rewrite(url);
}

export const config = {
  // Pages only: not Next internals, metadata files (robots, sitemap, icon, OG image) or anything with an extension.
  matcher: ["/((?!_next/|api/|robots\\.txt|sitemap\\.xml|icon\\.svg|opengraph-image|.*\\..*).*)"],
};
