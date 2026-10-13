"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { organizations, userOnboarding } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { startOnboarding } from "@/lib/onboarding";
import { TRACK_HIDDEN_COOKIE, hiddenTrackUsers } from "@/lib/tutorial-track";

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

/** Hides the getting-started track for the signed-in person. Works in preview sessions too. */
export async function hideTrack() {
  const user = await requireUser();
  const ids = new Set(await hiddenTrackUsers());
  // Kept in a cookie: it's a display preference for this browser, so preview sessions can use it too.
  ids.add(user.id);
  (await cookies()).set(TRACK_HIDDEN_COOKIE, [...ids].slice(-20).join(","), {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/", "layout");
}
