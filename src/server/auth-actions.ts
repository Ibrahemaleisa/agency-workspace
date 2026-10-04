"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  consumePasswordReset,
  createPasswordReset,
  createSession,
  destroySession,
  hashPassword,
  requireUser,
  revokeOtherSessions,
  verifyCredentials,
} from "@/lib/auth";
import { clientIp, hitAll, isLimited } from "@/lib/rate-limit";
import { emailEnabled, notificationEmail, sendEmail } from "@/lib/email";
import { str, type ActionState } from "@/lib/action-state";
import { getDict, getT } from "@/lib/lang";
import { DICT } from "@/lib/i18n";
import { withBrand } from "@/lib/brand";

const QUARTER_HOUR = 15 * 60;
const HOUR = 60 * 60;

export async function loginAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { t, lang } = await getDict();
  const email = str(fd, "email")?.toLowerCase();
  const password = str(fd, "password");
  if (!email || !password) return { error: t.login.errorRequired };
  // Slow down password guessing: per address (protects one account) and per IP (protects all of
  // them). Only failures count, so busy shared logins (e.g. the demo accounts) never lock out.
  const rules = [
    { key: `login:email:${email}`, limit: 10, windowSeconds: QUARTER_HOUR },
    { key: `login:ip:${await clientIp()}`, limit: 30, windowSeconds: QUARTER_HOUR },
  ];
  if ((await Promise.all(rules.map((r) => isLimited(r.key, r.limit)))).some(Boolean))
    return { error: t.login.errorTooMany };
  const user = await verifyCredentials(email, password);
  if (!user) {
    await hitAll(rules);
    return { error: t.login.errorInvalid };
  }
  await createSession(user.id);
  // Emails follow the language the user signed in with.
  if (user.lang !== lang) await db.update(users).set({ lang }).where(eq(users.id, user.id));
  redirect("/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

/** Signed-in users change their own password (other devices are signed out). */
export async function changePassword(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const { t } = await getT();
  const current = str(fd, "current") ?? "";
  const next = str(fd, "next") ?? "";
  if (next.length < 8) return { error: t.actions.passwordLength };
  if (!(await hitAll([{ key: `password:user:${user.id}`, limit: 10, windowSeconds: QUARTER_HOUR }])))
    return { error: t.account.tooMany };
  const row = await db.query.users.findFirst({ where: eq(users.id, user.id) });
  if (!row || !(await bcrypt.compare(current, row.passwordHash))) return { error: t.account.wrongCurrent };
  await db.update(users).set({ passwordHash: await hashPassword(next) }).where(eq(users.id, user.id));
  await revokeOtherSessions(user.id);
  return { ok: true };
}

/** "Forgot password": email a one-time link. Always answers the same way, so it can't reveal accounts. */
export async function requestPasswordReset(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { t, lang, brand } = await getDict();
  const email = str(fd, "email")?.toLowerCase();
  if (!email) return { error: t.login.errorRequired };
  if (!emailEnabled()) return { error: t.reset.noEmail };
  const allowed = await hitAll([
    { key: `reset:email:${email}`, limit: 3, windowSeconds: HOUR },
    { key: `reset:ip:${await clientIp()}`, limit: 10, windowSeconds: HOUR },
  ]);
  if (!allowed) return { error: t.login.errorTooMany };

  const reset = await createPasswordReset(email);
  if (reset) {
    // The email goes out in the account's language, like every other notification.
    const userLang = reset.user.lang === "en" || reset.user.lang === "ar" ? reset.user.lang : lang;
    const tr = withBrand(DICT[userLang], brand.name[userLang]);
    try {
      await sendEmail({
        to: reset.user.email,
        ...notificationEmail({
          lang: userLang,
          title: tr.reset.emailSubject,
          body: tr.reset.emailBody,
          link: `/reset?token=${reset.token}`,
          brand,
        }),
      });
    } catch (err) {
      console.error("[password reset email failed]", err);
    }
  }
  return { ok: true };
}

/** Finish a reset from the emailed link: new password, then signed in. */
export async function resetPassword(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { t } = await getDict();
  const token = str(fd, "token") ?? "";
  const password = str(fd, "password") ?? "";
  if (password.length < 8) return { error: t.reset.passwordLength };
  if (!(await hitAll([{ key: `reset-use:ip:${await clientIp()}`, limit: 20, windowSeconds: HOUR }])))
    return { error: t.login.errorTooMany };
  const userId = await consumePasswordReset(token, password);
  if (!userId) return { error: t.reset.invalid };
  await createSession(userId);
  redirect("/");
}
