import { eq } from "drizzle-orm";
import type { db } from "./index";
import { accounts } from "./schema";

type Db = typeof db;
/** The database, or a transaction on it. */
export type DbOrTx = Db | Parameters<Parameters<Db["transaction"]>[0]>[0];

/**
 * The account (person) for an email, created with this password hash if it doesn't exist yet.
 * An existing account keeps its own password — nobody can reset a person's password by adding them.
 */
export async function ensureAccount(tx: DbOrTx, email: string, passwordHash: string) {
  const normalized = email.trim().toLowerCase();
  const [created] = await tx
    .insert(accounts)
    .values({ email: normalized, passwordHash })
    .onConflictDoNothing({ target: accounts.email })
    .returning();
  if (created) return { account: created, created: true };
  const existing = await tx.query.accounts.findFirst({ where: eq(accounts.email, normalized) });
  return { account: existing!, created: false };
}
