import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { accounts, platformEvents, users } from "@/db/schema";
import { isPlatform } from "./platform";

/*
 * First-party product analytics for the Operra control center (platform mode only).
 * Visitors are a random id in a first-party cookie set by proxy.ts; no raw IPs are stored,
 * only the country Vercel derives from the request. Recording never breaks the request it's in.
 */
export const VISITOR_COOKIE = "operra_vid";
export const VISITOR_RE = /^[a-z0-9-]{8,64}$/;

export type EventType =
  | "site_view" // a page of the marketing site (via /api/t)
  | "signup_view" // a sign-up step was shown (meta.step)
  | "signup_step" // a sign-up step was completed (meta.step)
  | "workspace_created"
  | "login"
  | "login_failed"
  | "active"; // first request of the day from a signed-in membership

type EventFields = {
  accountId?: string | null;
  orgId?: string | null;
  signupId?: string | null;
  path?: string | null;
  meta?: Record<string, string | number>;
  visitorId?: string | null;
  country?: string | null;
};

export async function visitorId() {
  const v = (await cookies()).get(VISITOR_COOKIE)?.value;
  return v && VISITOR_RE.test(v) ? v : null;
}

export async function requestCountry() {
  const c = (await headers()).get("x-vercel-ip-country");
  return c && /^[A-Z]{2}$/.test(c) ? c : null;
}

export async function track(type: EventType, f: EventFields = {}) {
  if (!isPlatform()) return;
  try {
    await db.insert(platformEvents).values({
      type,
      visitorId: f.visitorId !== undefined ? f.visitorId : await visitorId(),
      country: f.country !== undefined ? f.country : await requestCountry(),
      accountId: f.accountId ?? null,
      orgId: f.orgId ?? null,
      signupId: f.signupId ?? null,
      path: f.path?.slice(0, 300) ?? null,
      meta: f.meta ?? null,
    });
  } catch (err) {
    console.error("[analytics] could not record", type, err);
  }
}

/** A successful sign-in into a membership. */
export async function trackLogin(accountId: string, orgId: string) {
  if (!isPlatform()) return;
  try {
    await db
      .update(accounts)
      .set({ lastLoginAt: new Date(), loginCount: sql`${accounts.loginCount} + 1` })
      .where(eq(accounts.id, accountId));
  } catch (err) {
    console.error("[analytics] could not update last sign-in", err);
  }
  await track("login", { accountId, orgId });
}

const SEEN_EVERY_MS = 5 * 60_000;

/** Keeps users.last_seen_at fresh (at most every 5 minutes) and records one "active" event per day. */
export async function touchLastSeen(user: { id: string; accountId: string; orgId: string; lastSeenAt: Date | null; readOnly?: boolean }) {
  if (!isPlatform() || user.readOnly) return;
  await touchOnce(user.id, user.accountId, user.orgId, user.lastSeenAt?.getTime() ?? 0);
}

// Once per request, however many times requireUser runs in it.
const touchOnce = cache(async (userId: string, accountId: string, orgId: string, lastMs: number) => {
  const now = new Date();
  if (lastMs && now.getTime() - lastMs < SEEN_EVERY_MS) return;
  try {
    await db.update(users).set({ lastSeenAt: now }).where(eq(users.id, userId));
  } catch (err) {
    console.error("[analytics] could not update last seen", err);
    return;
  }
  if (!lastMs || new Date(lastMs).toISOString().slice(0, 10) !== now.toISOString().slice(0, 10)) {
    await track("active", { accountId, orgId });
  }
});
