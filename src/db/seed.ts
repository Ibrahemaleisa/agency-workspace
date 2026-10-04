import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "./index";
import * as s from "./schema";
import { resetDemoData } from "./demo-data";

/**
 * `npm run db:seed` — wipe the database and load the demo workspace.
 * `--if-empty` (used by the Vercel build with SEED_DEMO=true) only seeds a brand-new database.
 */
async function main() {
  if (process.argv.includes("--if-empty")) {
    const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(s.organizations);
    if (n > 0) {
      console.log("Database already has data — skipping seed.");
      return;
    }
  }
  await resetDemoData();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
