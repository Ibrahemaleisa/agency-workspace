"use server";

import { redirect } from "next/navigation";
import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureAccount } from "@/db/accounts";
import { accounts, organizations, users } from "@/db/schema";
import { createSession, hashPassword } from "@/lib/auth";
import { str, type ActionState } from "@/lib/action-state";
import { getT } from "@/lib/lang";
import { isPlatform } from "@/lib/platform";

/** First-run setup: only works while the database has no users at all. */
export async function createWorkspace(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { t, lang } = await getT();
  if (isPlatform()) return { error: t.setup.errors.done };
  const [{ n }] = await db.select({ n: count() }).from(users);
  if (n > 0) return { error: t.setup.errors.done };

  const agency = str(fd, "agency");
  const agencyAr = str(fd, "agencyAr");
  const name = str(fd, "name");
  const email = str(fd, "email")?.toLowerCase();
  const password = str(fd, "password");
  if (!agency || !name || !email || !password) return { error: t.setup.errors.required };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: t.actions.invalidEmail };
  if (password.length < 8) return { error: t.actions.passwordLength };

  const slug = agency.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "agency";
  const existing = await db.query.organizations.findFirst();
  const org =
    existing ??
    (await db.insert(organizations).values({ name: agency, nameAr: agencyAr, slug, defaultLang: lang }).returning())[0];
  if (existing) {
    await db.update(organizations).set({ name: agency, nameAr: agencyAr }).where(eq(organizations.id, existing.id));
  }
  const passwordHash = await hashPassword(password);
  const admin = await db.transaction(async (tx) => {
    const { account, created } = await ensureAccount(tx, email, passwordHash);
    // First run: nobody uses this workspace yet, so a leftover account (no memberships) takes the new password.
    if (!created) await tx.update(accounts).set({ passwordHash }).where(eq(accounts.id, account.id));
    const [u] = await tx.insert(users).values({ orgId: org.id, accountId: account.id, name, email: account.email, role: "admin", lang }).returning();
    return u;
  });
  await createSession(admin.id);
  redirect("/settings/brand");
}
