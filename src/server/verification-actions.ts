"use server";

import { str, type ActionState } from "@/lib/action-state";
import { requireUser } from "@/lib/auth";
import { getSaasT } from "@/lib/i18n-saas";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { getOrgById } from "@/lib/tenant";
import { confirmVerification, sendVerification } from "@/lib/verification";

/** Signed in: send a new verification link to my email. */
export async function resendVerification(_prev?: ActionState, _fd?: FormData): Promise<ActionState> {
  void [_prev, _fd];
  const user = await requireUser({ allowLocked: true });
  const { t } = await getSaasT();
  const v = t.verify;
  if (!(await rateLimit(`verify:${user.accountId}`, 3, 3600))) return { error: v.rate };
  const org = await getOrgById(user.orgId);
  const result = await sendVerification(user.accountId, org!, user.lang === "ar" ? "ar" : "en");
  if (result.sent) return { ok: true };
  return { error: result.reason === "already_verified" ? v.already : result.reason === "not_configured" ? v.notConfigured : v.failed };
}

/** Public: confirm an address from the emailed link (a button press, so link scanners can't spend it). */
export async function confirmEmail(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { t } = await getSaasT();
  if (!(await rateLimit(`verify-confirm:${await clientIp()}`, 30, 900))) return { error: t.verify.rate };
  return (await confirmVerification(str(fd, "token") ?? "")) ? { ok: true } : { error: t.verify.invalid };
}
