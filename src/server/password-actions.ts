"use server";

import { str, type ActionState } from "@/lib/action-state";
import { getSaasT } from "@/lib/i18n-saas";
import { getLang } from "@/lib/lang";
import { requestPasswordReset, resetPassword } from "@/lib/password-reset";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 200;

/** Public: ask for a reset link. Always the same answer, so it can't be used to find accounts. */
export async function forgotPassword(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { t } = await getSaasT();
  const email = str(fd, "email")?.toLowerCase() ?? "";
  if (!isEmail(email)) return { error: t.reset.email };
  const ip = await clientIp();
  if (!(await rateLimit(`reset:ip:${ip}`, 10, 900)) || !(await rateLimit(`reset:email:${email}`, 3, 3600))) {
    return { error: t.reset.rate };
  }
  await requestPasswordReset(email, (await getLang()) === "ar" ? "ar" : "en");
  return { ok: true };
}

/** Public: set a new password with the emailed link. */
export async function setNewPassword(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { t } = await getSaasT();
  if (!(await rateLimit(`reset-confirm:${await clientIp()}`, 20, 900))) return { error: t.reset.rate };
  const password = str(fd, "password") ?? "";
  if (password.length < 8) return { error: t.reset.password };
  if (password !== (str(fd, "confirm") ?? "")) return { error: t.reset.mismatch };
  return (await resetPassword(str(fd, "token") ?? "", password)) ? { ok: true } : { error: t.reset.invalid };
}
