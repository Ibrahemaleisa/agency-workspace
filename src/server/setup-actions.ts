"use server";

import { redirect } from "next/navigation";
import { count, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { organizations, users } from "@/db/schema";
import { createSession, hashPassword } from "@/lib/auth";
import { str, type ActionState } from "@/lib/action-state";
import { getT } from "@/lib/lang";

/** First-run setup: only works while the database has no users at all. */
export async function createWorkspace(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { t, lang } = await getT();
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
  const passwordHash = await hashPassword(password);

  // Serialize setup: if two people submit at once, only the first creates the admin.
  const admin = await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('workspace-setup'))`);
    const [{ n: existingUsers }] = await tx.select({ n: count() }).from(users);
    if (existingUsers > 0) return null;
    const existing = await tx.query.organizations.findFirst();
    const org =
      existing ??
      (await tx.insert(organizations).values({ name: agency, nameAr: agencyAr, slug, defaultLang: lang }).returning())[0];
    if (existing) {
      await tx.update(organizations).set({ name: agency, nameAr: agencyAr }).where(eq(organizations.id, existing.id));
    }
    const [admin] = await tx
      .insert(users)
      .values({ orgId: org.id, name, email, passwordHash, role: "admin", lang })
      .returning();
    return admin;
  });
  if (!admin) return { error: t.setup.errors.done };
  await createSession(admin.id);
  redirect("/settings/brand");
}
