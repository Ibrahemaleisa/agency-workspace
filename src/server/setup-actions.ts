"use server";

import { redirect } from "next/navigation";
import { count, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { organizations, users } from "@/db/schema";
import { createSession, hashPassword } from "@/lib/auth";
import { str, type ActionState } from "@/lib/action-state";
import { getT } from "@/lib/lang";
import { clientIp, hitAll } from "@/lib/rate-limit";
import { setupMode, setupTokenMatches } from "@/lib/setup";

/** Any constant works; it only has to be the same for every setup attempt. */
const SETUP_LOCK = 724_001;

/** First-run setup: only works while the database has no users at all. */
export async function createWorkspace(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { t, lang } = await getT();
  const mode = setupMode();
  if (mode === "missing") return { error: t.setup.missingToken };
  if (mode === "token") {
    if (!(await hitAll([{ key: `setup:ip:${await clientIp()}`, limit: 10, windowSeconds: 15 * 60 }])))
      return { error: t.setup.errors.tooMany };
    if (!setupTokenMatches(str(fd, "code"))) return { error: t.setup.errors.badCode };
  }

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
  // One transaction behind an advisory lock: two simultaneous submits can't both create an admin.
  const admin = await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${SETUP_LOCK})`);
    const [{ n }] = await tx.select({ n: count() }).from(users);
    if (n > 0) return null;
    const existing = await tx.query.organizations.findFirst();
    const org =
      existing ??
      (await tx.insert(organizations).values({ name: agency, nameAr: agencyAr, slug, defaultLang: lang }).returning())[0];
    if (existing) {
      await tx.update(organizations).set({ name: agency, nameAr: agencyAr }).where(eq(organizations.id, existing.id));
    }
    const [created] = await tx
      .insert(users)
      .values({ orgId: org.id, name, email, passwordHash, role: "admin", lang })
      .returning();
    return created;
  });
  if (!admin) return { error: t.setup.errors.done };
  await createSession(admin.id);
  redirect("/settings/brand");
}
