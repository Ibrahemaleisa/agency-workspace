"use server";

import { redirect } from "next/navigation";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { accounts, users } from "@/db/schema";
import { destroySession, membershipsOf, requireUser, verifyAccount } from "@/lib/auth";
import { str, type ActionState } from "@/lib/action-state";
import { getDict } from "@/lib/lang";
import { TENANT_HINT_COOKIE, getHostTenant } from "@/lib/tenant";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { chooserAccount, endChooser, enterWorkspace, startChooser } from "@/lib/handoff";
import { cookies } from "next/headers";
import { track, trackLogin } from "@/lib/analytics";

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
  if (!account) {
    // Attach the attempt to the person when the address exists (the control center shows it).
    const known = await db.query.accounts.findFirst({ where: eq(accounts.email, email), columns: { id: true } });
    await track("login_failed", { accountId: known?.id, meta: { reason: known ? "password" : "unknown_email" } });
    return { error: t.login.errorInvalid };
  }

  // On a tenant's own host only that tenant counts; elsewhere every agency the person belongs to.
  const host = await getHostTenant();
  const memberships = await membershipsOf(account.id, { tenantId: host?.id });
  if (memberships.length === 0) return { error: t.login.errorInvalid };

  // Emails follow the language the person signed in with.
  await db.update(users).set({ lang }).where(inArray(users.id, memberships.map((m) => m.user.id)));

  // One agency, or the one whose branded sign-in page (/w/{slug}) this is: straight in.
  const hint = (await cookies()).get(TENANT_HINT_COOKIE)?.value;
  const chosen = memberships.length === 1 ? memberships[0] : memberships.find((m) => m.org.slug === hint);
  if (chosen) {
    await trackLogin(account.id, chosen.org.id);
    return enterWorkspace(chosen.user, chosen.org);
  }
  return startChooser(account.id);
}

/** Picks one agency after sign-in (the password was checked a moment ago on this browser). */
export async function chooseWorkspace(fd: FormData) {
  const accountId = await chooserAccount();
  if (!accountId) redirect("/login");
  const memberships = await membershipsOf(accountId);
  const chosen = memberships.find((m) => m.user.id === str(fd, "membershipId"));
  if (!chosen) redirect("/login/choose");
  await endChooser();
  await trackLogin(accountId, chosen.org.id);
  return enterWorkspace(chosen.user, chosen.org);
}

/**
 * Moves the signed-in person to another agency they belong to. The target must be one of *their*
 * memberships — the id from the form is only a choice among those, never trusted on its own.
 */
export async function switchWorkspace(fd: FormData) {
  const me = await requireUser({ allowLocked: true });
  const target = (await membershipsOf(me.accountId)).find((m) => m.user.id === str(fd, "membershipId"));
  if (!target || target.user.id === me.id) redirect("/");
  await db.update(users).set({ lang: me.lang }).where(eq(users.id, target.user.id));
  return enterWorkspace(target.user, target.org);
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
