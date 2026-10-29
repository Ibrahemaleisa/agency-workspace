import "server-only";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, asc, count, eq, like, lt } from "drizzle-orm";
import { db } from "@/db";
import { organizations, users, type Organization, type Role } from "@/db/schema";
import { populateDemoAgency } from "@/db/demo-data";
import { DEFAULT_BRAND, HEX } from "./brand";
import { deleteOrganization } from "./lifecycle";
import type { Lang } from "./i18n";

/*
 * The public demo (SHOW_DEMO_ACCOUNTS=true): every visitor who clicks "try it" gets a private copy
 * of the Northwind Studio sample agency, with the name and colours they picked. Nobody else sees
 * their changes; the copy is deleted when they sign out, or after DEMO_HOURS at the latest.
 *
 * Copies are ordinary organizations marked `is_demo` (which also keeps them from sending email)
 * with a "try-" slug. Their people have unroutable .invalid addresses and random, unused passwords:
 * the only way in is the demo's own entry, never a password.
 */

/** How long a copy (and the session into it) lives. */
export const DEMO_HOURS = 8;
/** Copies kept at once; past this the oldest are removed when a new one starts. */
const MAX_COPIES = 300;
const SLUG_PREFIX = "try-";

export const DEMO_ROLES = ["admin", "employee", "client"] as const satisfies readonly Role[];
export type DemoRole = (typeof DEMO_ROLES)[number];
export const isDemoRole = (v: unknown): v is DemoRole => (DEMO_ROLES as readonly unknown[]).includes(v);

/** The sample person each role signs in as (by the start of their address). */
const PERSONAS: Record<DemoRole, string> = { admin: "sara@", employee: "omar@", client: "lina@" };

export const isDemoCopy = <T extends Pick<Organization, "isDemo" | "slug">>(org: T | null | undefined): org is T =>
  !!org?.isDemo && org.slug.startsWith(SLUG_PREFIX);

export type DemoLook = { name?: string; primary?: string; accent?: string; lang: Lang };

/** Creates a visitor's private copy of the sample agency, in the look they chose. */
export async function createDemoCopy(look: DemoLook) {
  await pruneDemoCopies();
  const id = randomBytes(5).toString("hex");
  const name = look.name?.trim().slice(0, 60) || (look.lang === "ar" ? "نورثويند" : "Northwind Studio");
  const [org] = await db
    .insert(organizations)
    .values({
      name,
      nameAr: name,
      slug: `${SLUG_PREFIX}${id}`,
      isDemo: true,
      primaryColor: look.primary && HEX.test(look.primary) ? look.primary : DEFAULT_BRAND.primary,
      accentColor: look.accent && HEX.test(look.accent) ? look.accent : DEFAULT_BRAND.accent,
      defaultLang: look.lang,
      showLanding: false,
      onboardedAt: new Date(),
      showcaseClients: [],
    })
    .returning();
  try {
    await populateDemoAgency(org.id, {
      passwordHash: await bcrypt.hash(randomBytes(24).toString("hex"), 10),
      mail: (address) => {
        const [local, domain] = address.split("@");
        return `${local}@${domain.split(".")[0]}-${id}.invalid`;
      },
    });
    await db.update(users).set({ lang: look.lang }).where(eq(users.orgId, org.id));
  } catch (err) {
    await deleteOrganization(org.id).catch(() => {});
    throw err;
  }
  return org;
}

/** The sample person to sign in as for a role, inside one copy. */
export async function demoPersona(orgId: string, role: DemoRole) {
  return db.query.users.findFirst({
    where: and(eq(users.orgId, orgId), eq(users.role, role), like(users.email, `${PERSONAS[role]}%`)),
  });
}

/** Removes a visitor's copy (sign-out / "end demo"). Refuses anything that isn't a demo copy. */
export async function deleteDemoCopy(orgId: string) {
  const org = await db.query.organizations.findFirst({ where: eq(organizations.id, orgId) });
  if (!isDemoCopy(org)) return;
  await deleteOrganization(orgId);
}

/** Removes expired copies, and the oldest ones when there are too many. */
export async function pruneDemoCopies() {
  const isCopy = and(eq(organizations.isDemo, true), like(organizations.slug, `${SLUG_PREFIX}%`));
  const cutoff = new Date(Date.now() - DEMO_HOURS * 3600_000);
  const expired = await db.select({ id: organizations.id }).from(organizations).where(and(isCopy, lt(organizations.createdAt, cutoff)));
  const [{ n }] = await db.select({ n: count() }).from(organizations).where(isCopy);
  const excess = n - expired.length - (MAX_COPIES - 1);
  const oldest =
    excess > 0
      ? await db.select({ id: organizations.id }).from(organizations).where(isCopy).orderBy(asc(organizations.createdAt)).offset(expired.length).limit(excess)
      : [];
  for (const { id } of [...expired, ...oldest]) await deleteOrganization(id);
  return expired.length + oldest.length;
}
