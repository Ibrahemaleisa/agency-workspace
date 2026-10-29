import "server-only";
import { cache } from "react";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { organizations, type Organization } from "@/db/schema";

/**
 * The agency for public pages (landing, sign-in, lead form) before anyone is signed in: the only
 * agency of this deployment (or SITE_ORG_SLUG). Visitors' private demo copies never count.
 */
export const getPublicTenant = cache(async (): Promise<Organization | null> => {
  const slug = process.env.SITE_ORG_SLUG;
  return (
    (await db.query.organizations.findFirst({
      where: and(eq(organizations.isDemo, false), slug ? eq(organizations.slug, slug) : undefined),
      orderBy: asc(organizations.createdAt),
    })) ?? null
  );
});

export const getOrgById = cache(async (id: string) => db.query.organizations.findFirst({ where: eq(organizations.id, id) }));
