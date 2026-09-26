"use server";

import { notFound, redirect } from "next/navigation";
import { and, eq, like } from "drizzle-orm";
import { db } from "@/db";
import { organizations, users } from "@/db/schema";
import { createSession } from "@/lib/auth";
import { isPlatform } from "@/lib/platform";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";

/** Preview personas in the shared demo tenant (see src/db/seed-preview.ts). */
const PERSONAS = { admin: "sara@%", employee: "omar@%", client: "lina@%" } as const;

/**
 * Starts a read-only session as a demo persona. The session can browse the real product UI;
 * every server action it attempts is refused (lib/auth.ts → assertWritableRequest).
 */
export async function startPreview(fd: FormData) {
  if (!isPlatform()) notFound();
  const role = String(fd.get("role")) as keyof typeof PERSONAS;
  if (!(role in PERSONAS)) redirect("/preview");
  if (!(await rateLimit(`preview:${await clientIp()}`, 30, 3600))) redirect("/preview?limited=1");

  const [persona] = await db
    .select({ id: users.id })
    .from(users)
    .innerJoin(organizations, eq(organizations.id, users.orgId))
    .where(and(eq(organizations.isDemo, true), eq(organizations.slug, "demo"), eq(users.role, role), like(users.email, PERSONAS[role])))
    .limit(1);
  if (!persona) redirect("/preview?unavailable=1");

  await createSession(persona.id, { readOnly: true });
  redirect("/");
}
