import "server-only";
import { and, eq, inArray, notExists, sql } from "drizzle-orm";
import { db } from "@/db";
import { accounts, attachments, organizations, projects, tasks, users } from "@/db/schema";
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

/** Deletes a workspace and everything in it (used for visitors' private demo copies). */
export async function deleteOrganization(orgId: string) {
  const org = await db.query.organizations.findFirst({ where: eq(organizations.id, orgId) });
  if (!org) return null;
  const [members, files] = await Promise.all([
    db.select({ accountId: users.accountId }).from(users).where(eq(users.orgId, orgId)),
    db.select({ key: attachments.storageKey }).from(attachments).where(eq(attachments.orgId, orgId)),
  ]);
  // Projects restrict deleting their client, so they go first (tasks, files rows, chat cascade).
  await db.transaction(async (tx) => {
    await tx.delete(projects).where(eq(projects.orgId, orgId));
    await tx.delete(organizations).where(eq(organizations.id, orgId));
  });
  // People whose only workspace this was lose their sign-in too.
  await deleteOrphanAccounts(members.map((m) => m.accountId));
  await removeFiles(files.map((f) => f.key));
  return org;
}
