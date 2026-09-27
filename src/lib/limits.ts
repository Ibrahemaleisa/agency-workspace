import "server-only";
import { and, count, eq, gt, isNull, ne } from "drizzle-orm";
import { db } from "@/db";
import { clients, invitations, organizations, plans, subscriptions, users } from "@/db/schema";
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
    .select({ isDemo: organizations.isDemo, maxMembers: plans.maxMembers, maxClients: plans.maxClients })
    .from(organizations)
    .leftJoin(subscriptions, eq(subscriptions.orgId, organizations.id))
    .leftJoin(plans, eq(plans.code, subscriptions.planCode))
    .where(eq(organizations.id, orgId))
    .limit(1);
  if (!row || row.isDemo) return null;
  return { maxMembers: row.maxMembers, maxClients: row.maxClients };
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
