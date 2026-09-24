"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, destroySession, verifyCredentials } from "@/lib/auth";
import { str, type ActionState } from "@/lib/action-state";
import { getDict } from "@/lib/lang";

export async function loginAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { t, lang } = await getDict();
  const email = str(fd, "email");
  const password = str(fd, "password");
  if (!email || !password) return { error: t.login.errorRequired };
  const user = await verifyCredentials(email, password);
  if (!user) return { error: t.login.errorInvalid };
  await createSession(user.id);
  // Emails follow the language the user signed in with.
  if (user.lang !== lang) await db.update(users).set({ lang }).where(eq(users.id, user.id));
  redirect("/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
