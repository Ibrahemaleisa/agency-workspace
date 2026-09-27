"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { and, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/db";
import { accounts, sessions, users } from "@/db/schema";
import { SESSION_COOKIE, hashPassword, hashToken, requireUser, verifyAccount } from "@/lib/auth";
import { str, type ActionState } from "@/lib/action-state";
import { getT } from "@/lib/lang";
import { isLang, LANG_COOKIE } from "@/lib/i18n";
import { rateLimit } from "@/lib/rate-limit";

/** Anyone: their own name, job title, language and email notifications (this membership). */
export async function updateProfile(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser({ allowLocked: true });
  const { t } = await getT();
  const name = str(fd, "name")?.slice(0, 120);
  if (!name) return { error: t.settings.errors.name };
  const lang = str(fd, "lang");
  await db
    .update(users)
    .set({
      name,
      // Client users have no job title in the agency.
      ...(user.role !== "client" ? { title: str(fd, "title")?.slice(0, 120) ?? null } : {}),
      ...(isLang(lang) ? { lang } : {}),
      emailNotifications: str(fd, "emailNotifications") === "on",
    })
    .where(eq(users.id, user.id));
  if (isLang(lang)) {
    (await cookies()).set(LANG_COOKIE, lang, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * Anyone: change their own password (one password for all their agencies). Needs the current one;
 * every other session of the person, in every agency, is signed out — this one stays.
 */
export async function changeOwnPassword(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser({ allowLocked: true });
  const e = (await getT()).t.settings.errors;
  if (!(await rateLimit(`pw-change:${user.accountId}`, 10, 15 * 60))) return { error: e.rate };
  const current = str(fd, "current") ?? "";
  const next = str(fd, "password") ?? "";
  if (next.length < 8) return { error: e.length };
  if (next !== (str(fd, "confirm") ?? "")) return { error: e.match };
  const account = await db.query.accounts.findFirst({ where: eq(accounts.id, user.accountId) });
  if (!account || !(await verifyAccount(account.email, current))) return { error: e.current };

  const passwordHash = await hashPassword(next);
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  await db.transaction(async (tx) => {
    await tx.update(accounts).set({ passwordHash, updatedAt: new Date() }).where(eq(accounts.id, account.id));
    const memberships = await tx.select({ id: users.id }).from(users).where(eq(users.accountId, account.id));
    if (memberships.length) {
      await tx
        .delete(sessions)
        .where(
          and(
            inArray(
              sessions.userId,
              memberships.map((m) => m.id),
            ),
            token ? ne(sessions.id, hashToken(token)) : undefined,
          ),
        );
    }
  });
  return { ok: true };
}
