import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { consumeLoginToken, createSession } from "@/lib/auth";
import { redirectTo, safePath } from "@/lib/request";
import { getHostTenant } from "@/lib/tenant";

/** GET /auth/handoff?token=…&next=/ — redeem a single-use sign-in token on the tenant's own host. */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  const userId = token ? await consumeLoginToken(token) : null;
  if (!userId) return redirectTo("/login?expired=1");

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  const host = await getHostTenant();
  if (!user || !user.active || (host && host.id !== user.orgId)) {
    return redirectTo("/login");
  }
  await createSession(user.id);
  return redirectTo(safePath(request.nextUrl.searchParams.get("next")));
}
