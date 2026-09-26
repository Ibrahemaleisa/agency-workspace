import "dotenv/config";
import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import { db } from "./index";
import * as s from "./schema";
import { populateDemoAgency } from "./demo-data";

/**
 * Local / single-agency demo: WIPES the database and loads the Northwind Studio sample agency.
 * Never run against a customer's database. The platform's preview tenant uses seed-preview.ts instead.
 */
async function main() {
  // `--if-empty` (used by the Vercel build) only seeds a brand-new database, never resets one.
  if (process.argv.includes("--if-empty")) {
    const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(s.organizations);
    if (n > 0) {
      console.log("Database already has data — skipping seed.");
      return;
    }
  }
  console.log("Resetting database…");
  await db.execute(sql`TRUNCATE organizations, sessions, file_blobs RESTART IDENTITY CASCADE`);

  const [org] = await db.insert(s.organizations).values({ name: "Northwind Studio", nameAr: "نورثويند", slug: "northwind", showcaseClients: ["Bloom Café", "Atlas Fitness", "Verde Real Estate", "Nimbus Tech"], contactEmail: "hello@northwind.agency" }).returning();
  await populateDemoAgency(org.id, { passwordHash: await bcrypt.hash("password", 10) });

  console.log("✓ Seed complete");
  console.log("  Log in with any of these (password: password):");
  console.log("    Admin:    sara@northwind.agency");
  console.log("    Employee: omar@northwind.agency  (also leila@, maya@, yusuf@, nour@, adam@)");
  console.log("    Client:   lina@bloomcafe.com  (also daniel@atlasfitness.com, rana@verde-re.com)");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
