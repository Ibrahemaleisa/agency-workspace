"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, destroySession, verifyCredentials } from "@/lib/auth";
import { str, type ActionState } from "@/lib/action-state";
import { getDict } from "@/lib/lang";
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
