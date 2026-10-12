import "server-only";
import { and, count, eq, gt, isNull, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { attachments, clients, invitations, organizations, plans, subscriptions, users } from "@/db/schema";
import { isPlatform } from "./platform";
import { getSaasT } from "./i18n-saas";

/*
 * Plan limits (plans.max_members / max_clients; null = unlimited). Team members are admins and
 * team; client users don't count. Pending team invitations count, so a plan can't be over-invited.
 * Single-agency deployments and the demo tenant have no limits.
 */
async function limitsOf(orgId: string) {
  if (!isPlatform()) return null;
  const [row] = await db
    .select({ isDemo: organizations.isDemo, maxMembers: plans.maxMembers, maxClients: plans.maxClients, maxStorageMb: plans.maxStorageMb })
    .from(organizations)
    .leftJoin(subscriptions, eq(subscriptions.orgId, organizations.id))
    .leftJoin(plans, eq(plans.code, subscriptions.planCode))
    .where(eq(organizations.id, orgId))
    .limit(1);
  if (!row || row.isDemo) return null;
  return { maxMembers: row.maxMembers, maxClients: row.maxClients, maxStorageMb: row.maxStorageMb };
}

/** An error message when adding `adding` more team members would pass the plan's limit, else null. */
export async function teamLimitError(orgId: string, opts: { adding?: number; countInvites?: boolean } = {}) {
  const l = await limitsOf(orgId);
  if (!l?.maxMembers) return null;
  const [{ n: members }] = await db
    .select({ n: count() })
    .from(users)
    .where(and(eq(users.orgId, orgId), eq(users.active, true), ne(users.role, "client")));
  let pending = 0;
  if (opts.countInvites !== false) {
    [{ n: pending }] = await db
      .select({ n: count() })
      .from(invitations)
      .where(
        and(
          eq(invitations.orgId, orgId),
          ne(invitations.role, "client"),
          isNull(invitations.acceptedAt),
          isNull(invitations.revokedAt),
          gt(invitations.expiresAt, new Date()),
        ),
      );
  }
  if (members + pending + (opts.adding ?? 1) <= l.maxMembers) return null;
  return (await getSaasT()).t.limits.members(l.maxMembers);
}

/** An error message when one more client would pass the plan's limit, else null. */
export async function clientLimitError(orgId: string) {
  const l = await limitsOf(orgId);
  if (!l?.maxClients) return null;
  const [{ n }] = await db.select({ n: count() }).from(clients).where(eq(clients.orgId, orgId));
  if (n + 1 <= l.maxClients) return null;
  return (await getSaasT()).t.limits.clients(l.maxClients);
}

/** Bytes of files stored by a workspace (task attachments). */
export async function storageUsedBytes(orgId: string) {
  const [{ n }] = await db
    .select({ n: sql<string>`coalesce(sum(${attachments.size}), 0)` })
    .from(attachments)
    .where(eq(attachments.orgId, orgId));
  return Number(n);
}

/** The plan's storage allowance in bytes, or null when unlimited (and outside platform mode). */
export async function storageLimitBytes(orgId: string) {
  const l = await limitsOf(orgId);
  return l?.maxStorageMb ? l.maxStorageMb * 1024 * 1024 : null;
}

/** An error message when storing `adding` more bytes would pass the plan's storage, else null. */
export async function storageLimitError(orgId: string, adding: number) {
  const max = await storageLimitBytes(orgId);
  if (max === null) return null;
  if ((await storageUsedBytes(orgId)) + adding <= max) return null;
  return (await getSaasT()).t.limits.storage(Math.round((max / 1024 / 1024 / 1024) * 10) / 10);
}
