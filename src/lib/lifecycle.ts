import "server-only";
import { and, eq, inArray, isNotNull, notExists, sql } from "drizzle-orm";
import { db } from "@/db";
import { accounts, attachments, organizations, planRequests, projects, subscriptions, tasks, users } from "@/db/schema";
import { providerByName } from "./billing";
import { removeFiles } from "./uploads";

/*
 * Deleting things for good. Rows cascade in the database; stored files don't, so their keys are
 * collected first and removed after the rows are gone.
 */

/** Storage keys of every file attached to tasks in these projects. */
export async function fileKeysForProjects(projectIds: string[]) {
  if (projectIds.length === 0) return [];
  const rows = await db
    .select({ key: attachments.storageKey })
    .from(attachments)
    .innerJoin(tasks, eq(tasks.id, attachments.taskId))
    .where(inArray(tasks.projectId, projectIds));
  return rows.map((r) => r.key);
}

/** Accounts left with no membership anywhere are deleted (nothing else uses them). */
export async function deleteOrphanAccounts(accountIds: string[]) {
  if (accountIds.length === 0) return;
  await db
    .delete(accounts)
    .where(
      and(
        inArray(accounts.id, accountIds),
        notExists(db.select({ one: sql`1` }).from(users).where(eq(users.accountId, accounts.id))),
      ),
    );
}

export class ProviderCancelError extends Error {}

/**
 * Deletes a workspace and everything in it. A subscription with a payment provider is stopped
 * first — if that fails nothing is deleted, so nobody keeps paying for a workspace that's gone.
 * Invoices are kept (their workspace link becomes empty; name and serial were copied onto them).
 */
export async function deleteOrganization(orgId: string) {
  const org = await db.query.organizations.findFirst({ where: eq(organizations.id, orgId) });
  if (!org) return null;
  const sub = await db.query.subscriptions.findFirst({ where: eq(subscriptions.orgId, orgId) });
  if (sub?.providerSubscriptionId && sub.status !== "canceled" && sub.status !== "expired") {
    const provider = providerByName(sub.provider);
    if (provider && sub.provider !== "manual") {
      try {
        await provider.cancel(sub.providerSubscriptionId);
      } catch (err) {
        console.error("[delete workspace] provider cancel failed", { orgId, err });
        throw new ProviderCancelError();
      }
    }
  }
  const [members, files, receipts] = await Promise.all([
    db.select({ accountId: users.accountId }).from(users).where(eq(users.orgId, orgId)),
    db.select({ key: attachments.storageKey }).from(attachments).where(eq(attachments.orgId, orgId)),
    db
      .select({ key: planRequests.receiptKey })
      .from(planRequests)
      .where(and(eq(planRequests.orgId, orgId), isNotNull(planRequests.receiptKey))),
  ]);
  // Projects restrict deleting their client, so they go first (tasks, files rows, chat cascade).
  await db.transaction(async (tx) => {
    await tx.delete(projects).where(eq(projects.orgId, orgId));
    await tx.delete(organizations).where(eq(organizations.id, orgId));
  });
  // People whose only workspace this was lose their sign-in too.
  await deleteOrphanAccounts(members.map((m) => m.accountId));
  await removeFiles([...files.map((f) => f.key), ...receipts.map((r) => r.key!).filter(Boolean)]);
  return org;
}
