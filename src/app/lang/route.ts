import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { LANG_COOKIE, isLang } from "@/lib/i18n";
import { redirectTo, safePath } from "@/lib/request";

/** GET /lang?to=en&next=/login — remember the visitor's language and go back. */
export async function GET(request: NextRequest) {
  const to = request.nextUrl.searchParams.get("to");
  // Only same-site relative paths, to avoid open redirects.
  const res = redirectTo(safePath(request.nextUrl.searchParams.get("next")));
  if (isLang(to)) {
    res.headers.append("Set-Cookie", `${LANG_COOKIE}=${to}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`);
    // Signed-in users also get their emails in this language.
    const user = await getCurrentUser();
    if (user && !user.readOnly && user.lang !== to) await db.update(users).set({ lang: to }).where(eq(users.id, user.id));
  }
  return res;
}
