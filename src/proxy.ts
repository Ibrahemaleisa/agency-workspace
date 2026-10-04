import { NextResponse, type NextRequest } from "next/server";

/**
 * Cheap gate based on the session cookie (full validation happens server-side):
 * - "/" shows the public landing page to visitors and the dashboard to signed-in users;
 * - every other app route bounces visitors to /login.
 */
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has("apm_session");
  if (hasSession) return NextResponse.next();

  const url = request.nextUrl.clone();
  if (url.pathname === "/") {
    url.pathname = "/welcome";
    return NextResponse.rewrite(url);
  }
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  // Public: sign-in, landing, first-run setup, language switch, brand logo, static assets.
  matcher: ["/((?!login|welcome|setup|lang|brand-logo|icon|apple-icon|_next/static|_next/image|favicon.ico).*)"],
};
