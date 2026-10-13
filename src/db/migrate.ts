import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

/**
 * Applies the migrations in ./drizzle (same bookkeeping table as `drizzle-kit migrate`), all in one
 * transaction: either every pending migration applies or none does.
 *
 * Used by the Vercel build instead of `drizzle-kit migrate`, which exits 1 without printing the
 * database's error — this prints the failing statement and Postgres' own message, code and hint.
 */
async function main() {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!url) throw new Error("DATABASE_URL (or POSTGRES_URL) is not set.");
  const client = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
  try {
    // Don't queue forever behind a long transaction from the running app: fail fast and say so.
    await client`set lock_timeout = '20s'`;
    await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
    console.log("✓ Migrations applied.");
  } finally {
    await client.end({ timeout: 5 });
  }
}

main().catch((err) => {
  const cause = (err?.cause ?? err) as Record<string, unknown>;
  console.error("✗ Migration failed — nothing was applied (the migrations run in one transaction).");
  if (err?.query) console.error(`  Statement: ${String(err.query).slice(0, 2000)}`);
  for (const key of ["message", "code", "detail", "hint", "where", "schema_name", "table_name", "constraint_name"]) {
    if (cause?.[key]) console.error(`  ${key}: ${String(cause[key])}`);
  }
  if (cause?.code === "42501") console.error("  → The database login lacks a privilege (see message). Grant it, or run migrations as the database owner.");
  if (cause?.code === "55P03") console.error("  → Timed out waiting for a table lock held by the running app. Redeploy to retry.");
  process.exit(1);
});
