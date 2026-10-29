import "dotenv/config";
import postgres from "postgres";

/**
 * ONE-OFF, DESTRUCTIVE: empties the public demo's database so the build can migrate it from
 * scratch and reload the sample agency (seed.ts --if-empty). For when the demo database's
 * migration history no longer matches its tables.
 *
 * Does nothing unless DEMO_REBUILD_DB, SEED_DEMO and SHOW_DEMO_ACCOUNTS are all "true" AND the
 * database is named workspace_demo. Set DEMO_REBUILD_DB on the demo project for one deployment,
 * then remove it. Never set it on a customer.
 */
async function main() {
  const on = (k: string) => process.env[k] === "true";
  if (!on("DEMO_REBUILD_DB")) return;
  if (!on("SEED_DEMO") || !on("SHOW_DEMO_ACCOUNTS")) {
    console.log("DEMO_REBUILD_DB ignored: not the public demo.");
    return;
  }
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!url) throw new Error("DATABASE_URL (or POSTGRES_URL) is not set.");
  const sql = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
  try {
    const [{ db }] = await sql<{ db: string }[]>`select current_database() as db`;
    if (db !== "workspace_demo") {
      console.log(`DEMO_REBUILD_DB ignored: database is "${db}", not workspace_demo.`);
      return;
    }
    // Everything this login created in this database: tables, types, sequences, the drizzle schema.
    await sql`drop owned by current_user cascade`;
    console.log("✓ Demo database emptied; migrations and the sample agency follow.");
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error("✗ Demo database rebuild failed:", err?.message ?? err);
  process.exit(1);
});
