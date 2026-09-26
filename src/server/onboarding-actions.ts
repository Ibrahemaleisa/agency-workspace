"use server";

import { redirect } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { organizations, userOnboarding } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { startOnboarding } from "@/lib/onboarding";

/** Saves the user's tutorial position; finishing or skipping closes it. */
export async function saveTourProgress(step: number, status: "active" | "completed" | "skipped") {
  const user = await requireUser();
  const s = Math.max(0, Math.min(50, Math.floor(step)));
  await db
    .update(userOnboarding)
    .set({ step: s, status, updatedAt: new Date(), ...(status !== "active" ? { completedAt: new Date() } : {}) })
    .where(eq(userOnboarding.userId, user.id));
  // The first admin to finish the tour marks the workspace as onboarded.
  if (status !== "active" && user.role === "admin") {
    await db
      .update(organizations)
      .set({ onboardedAt: new Date() })
      .where(and(eq(organizations.id, user.orgId), isNull(organizations.onboardedAt)));
  }
}

/** Starts the tutorial again from the first step. */
export async function restartTour() {
  const user = await requireUser();
  await startOnboarding(user);
  redirect("/");
}
