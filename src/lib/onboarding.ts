import "server-only";
import { db } from "@/db";
import { userOnboarding } from "@/db/schema";
import type { Role } from "@/db/schema";

/** Tutorial tracks. Team members pick theirs by focus (set when invited or added). */
export type Flow = "admin" | "account" | "production" | "client";

export const FOCUSES = ["account", "production"] as const;
export type Focus = (typeof FOCUSES)[number];
export const parseFocus = (v: string | null | undefined): Focus | null =>
  v && (FOCUSES as readonly string[]).includes(v) ? (v as Focus) : null;

export function flowFor(role: Role, focus: string | null | undefined): Flow {
  if (role === "admin") return "admin";
  if (role === "client") return "client";
  return focus === "production" ? "production" : "account";
}

/** Start (or restart) a user's tutorial. Safe to call repeatedly. */
export async function startOnboarding(user: { id: string; orgId: string; role: Role; focus?: string | null }) {
  const flow = flowFor(user.role, user.focus);
  await db
    .insert(userOnboarding)
    .values({ userId: user.id, orgId: user.orgId, flow, step: 0, status: "active" })
    .onConflictDoUpdate({
      target: userOnboarding.userId,
      set: { flow, step: 0, status: "active", updatedAt: new Date(), completedAt: null },
    });
}
