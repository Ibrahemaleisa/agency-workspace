"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, destroySession, verifyCredentials } from "@/lib/auth";
import { str, type ActionState } from "@/lib/action-state";
import { getDict } from "@/lib/lang";
import { getHostTenant, getOrgById, rememberTenant } from "@/lib/tenant";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { workspaceRedirectUrl } from "@/lib/handoff";

export async function loginAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { t, lang } = await getDict();
  const email = str(fd, "email")?.toLowerCase();
  const password = str(fd, "password");
  if (!email || !password) return { error: t.login.errorRequired };

  // Slow down password guessing per address and per client.
  const ip = await clientIp();
  const limited =
    !(await rateLimit(`login:ip:${ip}`, 30, 15 * 60)) || !(await rateLimit(`login:email:${email}`, 10, 15 * 60));
  if (limited) return { error: t.login.errorRateLimited };

  const host = await getHostTenant();
  const user = await verifyCredentials(email, password, host?.id);
  if (!user) return { error: t.login.errorInvalid };

  // Emails follow the language the user signed in with.
  if (user.lang !== lang) await db.update(users).set({ lang }).where(eq(users.id, user.id));

  // On the right host already → a normal session. Otherwise hand the sign-in over to the
  // tenant's own host (subdomain / custom domain) with a single-use token.
  const org = await getOrgById(user.orgId);
  const target = org && !host ? await workspaceRedirectUrl(org, user.id) : null;
  if (target) redirect(target);
  if (org) await rememberTenant(org);
  await createSession(user.id);
  redirect("/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
