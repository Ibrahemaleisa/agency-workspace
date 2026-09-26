import "dotenv/config";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { db } from "./index";
import * as s from "./schema";
import { populateDemoAgency } from "./demo-data";

/**
 * Creates (or with --reset, recreates) the platform's shared, read-only preview tenant.
 * NON-DESTRUCTIVE for every other tenant: it only ever touches the organization with
 * slug "demo" AND is_demo = true. Its accounts have random, unused passwords and unroutable
 * .invalid addresses — visitors enter through /preview, never with a password.
 */
export const PREVIEW_SLUG = "demo";

async function main() {
  const reset = process.argv.includes("--reset");
  const existing = await db.query.organizations.findFirst({ where: eq(s.organizations.slug, PREVIEW_SLUG) });
  if (existing && !existing.isDemo) throw new Error(`Refusing: slug "${PREVIEW_SLUG}" belongs to a real tenant.`);
  if (existing && !reset) {
    console.log(`Preview tenant already exists (${existing.serial}). Use --reset to rebuild its sample data.`);
    return;
  }
  if (existing) {
    // Cascades to that tenant's users, projects, tasks, files rows, etc. — nothing else.
    await db.delete(s.organizations).where(and(eq(s.organizations.id, existing.id), eq(s.organizations.isDemo, true)));
    console.log(`Removed previous preview tenant ${existing.serial}.`);
  }
  const [org] = await db
    .insert(s.organizations)
    .values({
      name: "Northwind Studio",
      nameAr: "نورثويند",
      slug: PREVIEW_SLUG,
      isDemo: true,
      status: "active",
      defaultLang: "en",
      showLanding: false,
      onboardedAt: new Date(),
      showcaseClients: [],
    })
    .returning();
  const passwordHash = await bcrypt.hash(randomBytes(24).toString("hex"), 10);
  await populateDemoAgency(org.id, {
    passwordHash,
    mail: (address) => `${address.split("@")[0]}@${address.split("@")[1].split(".")[0]}.preview.invalid`,
  });
  console.log(`✓ Preview tenant ready: ${org.serial} (slug "${PREVIEW_SLUG}")`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
