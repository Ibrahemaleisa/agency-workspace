"use server";

import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { userOnboarding } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createSession, destroySession, getCurrentUser, requireUser } from "@/lib/auth";
import { str } from "@/lib/action-state";
import { DEMO_HOURS, createDemoCopy, deleteDemoCopy, demoPersona, isDemoCopy, isDemoRole } from "@/lib/demo-sandbox";
import { getLang } from "@/lib/lang";
import { startOnboarding } from "@/lib/onboarding";
import { isSharedDemo } from "@/lib/platform";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { getOrgById } from "@/lib/tenant";
import type { User } from "@/db/schema";

/** Signs the visitor in as one of the copy's sample people; the tour greets each one once. */
async function enterAs(persona: User) {
  const toured = await db.query.userOnboarding.findFirst({ where: eq(userOnboarding.userId, persona.id) });
  if (!toured) await startOnboarding(persona);
  await createSession(persona.id, { hours: DEMO_HOURS });
  redirect("/");
}

/**
 * Landing page → "try it": a fresh private copy of the sample agency in the visitor's chosen name
 * and colours, entered as the chosen role. A copy the visitor already had is removed first.
 */
export async function startDemo(fd: FormData) {
  if (!isSharedDemo()) notFound();
  const role = str(fd, "role");
  if (!isDemoRole(role)) redirect("/");
  if (!(await rateLimit(`demo:${await clientIp()}`, 20, 3600))) redirect("/?demo=busy");

  const current = await getCurrentUser();
  if (current) {
    const org = await getOrgById(current.orgId);
    await destroySession();
    if (isDemoCopy(org)) await deleteDemoCopy(current.orgId);
  }

  const org = await createDemoCopy({
    name: str(fd, "name") ?? undefined,
    primary: str(fd, "primary") ?? undefined,
    accent: str(fd, "accent") ?? undefined,
    lang: await getLang(),
  });
  const persona = await demoPersona(org.id, role);
  if (!persona) redirect("/?demo=unavailable");
  await enterAs(persona);
}

/** Inside a copy: see the same agency as another role (admin, team member, client). */
export async function switchDemoRole(fd: FormData) {
  const user = await requireUser();
  const role = str(fd, "role");
  const org = await getOrgById(user.orgId);
  if (!isSharedDemo() || !isDemoCopy(org) || !isDemoRole(role) || role === user.role) redirect("/");
  const persona = await demoPersona(user.orgId, role);
  if (!persona) redirect("/");
  await destroySession();
  await enterAs(persona);
}
