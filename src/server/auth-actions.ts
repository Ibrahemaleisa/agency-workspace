"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import bcrypt from "bcryptjs";
import { sessions, users } from "@/db/schema";
import { createSession, destroySession, hashPassword, requireUser, verifyCredentials } from "@/lib/auth";
import { str, type ActionState } from "@/lib/action-state";
import { getDict, getT } from "@/lib/lang";
import { clearHits, clientIp, isLimited, recordHit } from "@/lib/rate-limit";

const LOGIN_WINDOW = 15 * 60 * 1000;

export async function loginAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { t, lang } = await getDict();
  const email = str(fd, "email");
  const password = str(fd, "password");
  if (!email || !password) return { error: t.login.errorRequired };

  // Slow down password guessing: 10 failures per account per IP, 30 per IP, per 15 minutes.
  // (Keyed by IP as well so nobody can lock a real user out by failing on purpose.)
  const ip = await clientIp();
  const accountKey = `login:${email.toLowerCase()}:${ip}`;
  const ipKey = `login-ip:${ip}`;
  const [accountLimited, ipLimited] = await Promise.all([
    isLimited(accountKey, 10, LOGIN_WINDOW),
    isLimited(ipKey, 30, LOGIN_WINDOW),
  ]);
  if (accountLimited || ipLimited) return { error: t.login.errorTooMany };

  const user = await verifyCredentials(email, password);
  if (!user) {
    await Promise.all([recordHit(accountKey), recordHit(ipKey)]);
    return { error: t.login.errorInvalid };
  }
  await clearHits(accountKey);
  await createSession(user.id);
  // Emails follow the language the user signed in with.
  if (user.lang !== lang) await db.update(users).set({ lang }).where(eq(users.id, user.id));
  redirect("/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

/** Signed-in users change their own password (current password required). */
export async function changeOwnPassword(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const { t } = await getT();
  const e = t.account.errors;
  // The public demo shares one set of logins between visitors (see SHOW_DEMO_ACCOUNTS).
  if (process.env.SHOW_DEMO_ACCOUNTS === "true") return { error: t.actions.demoLocked };

  const current = str(fd, "current");
  const next = str(fd, "next");
  const confirm = str(fd, "confirm");
  if (!current || !next || !confirm) return { error: e.required };

  const key = `password:${user.id}`;
  if (await isLimited(key, 10, LOGIN_WINDOW)) return { error: e.tooMany };
  const row = await db.query.users.findFirst({ where: eq(users.id, user.id), columns: { passwordHash: true } });
  if (!row || !(await bcrypt.compare(current, row.passwordHash))) {
    await recordHit(key);
    return { error: e.wrongCurrent };
  }
  if (next.length < 8) return { error: t.actions.passwordLength };
  if (next !== confirm) return { error: e.mismatch };
  if (next === current) return { error: e.same };

  await db.update(users).set({ passwordHash: await hashPassword(next) }).where(eq(users.id, user.id));
  await clearHits(key);
  // Sign out every other device, then start a fresh session here.
  await db.delete(sessions).where(eq(sessions.userId, user.id));
  await createSession(user.id);
  return { ok: true };
}
