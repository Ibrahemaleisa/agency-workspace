"use server";

import { redirect } from "next/navigation";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, destroySession, getCurrentUser, membershipsOf, verifyAccount } from "@/lib/auth";
import { deleteDemoCopy, isDemoCopy } from "@/lib/demo-sandbox";
import { getOrgById } from "@/lib/tenant";
import { str, type ActionState } from "@/lib/action-state";
import { getDict } from "@/lib/lang";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";

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

  const account = await verifyAccount(email, password);
  if (!account) return { error: t.login.errorInvalid };

  const memberships = await membershipsOf(account.id);
  if (memberships.length === 0) return { error: t.login.errorInvalid };

  // Emails follow the language the person signed in with.
  await db.update(users).set({ lang }).where(inArray(users.id, memberships.map((m) => m.user.id)));

  await createSession(memberships[0].user.id);
  redirect("/");
}

/** Signs out. On the public demo, signing out of a private copy deletes it with every change made. */
export async function logoutAction() {
  const user = await getCurrentUser();
  const org = user ? await getOrgById(user.orgId) : null;
  await destroySession();
  if (isDemoCopy(org)) {
    await deleteDemoCopy(org.id);
    redirect("/?demo=ended");
  }
  redirect("/login");
}
