"use server";

import { revalidatePath } from "next/cache";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { leads, organizations } from "@/db/schema";
import { listAdminIds, notify } from "@/lib/events";
import { nt } from "@/lib/notify-text";
import { requireUser } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";
import { getLang } from "@/lib/lang";
import { DICT } from "@/lib/i18n";
import { str, type ActionState } from "@/lib/action-state";

/** The agency that owns the public landing page (single-agency deployments use the first one). */
async function siteOrg() {
  const slug = process.env.SITE_ORG_SLUG;
  return db.query.organizations.findFirst({
    where: slug ? eq(organizations.slug, slug) : undefined,
    orderBy: asc(organizations.createdAt),
  });
}

/** Public: a visitor requests a project from the landing page. */
export async function submitLead(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const lang = await getLang();
  const t = DICT[lang].contact;
  // Honeypot: real visitors never fill this hidden field.
  if (str(fd, "website")) return { ok: true };

  const name = str(fd, "name")?.slice(0, 120);
  const email = str(fd, "email")?.slice(0, 200) ?? null;
  const phone = str(fd, "phone")?.slice(0, 40) ?? null;
  if (!name || (!email && !phone)) return { error: t.errorRequired };

  const org = await siteOrg();
  if (!org) return { error: "Unavailable" };

  const [lead] = await db
    .insert(leads)
    .values({
      orgId: org.id,
      name,
      email,
      phone,
      company: str(fd, "company")?.slice(0, 200) ?? null,
      service: str(fd, "service")?.slice(0, 60) ?? null,
      message: str(fd, "message")?.slice(0, 4000) ?? null,
      lang,
    })
    .returning();

  await notify({ id: null, orgId: org.id }, await listAdminIds(org.id), {
    type: "lead",
    title: nt.lead(lead.name, lead.company),
    body: lead.message,
    link: "/leads",
  });
  revalidatePath("/leads");
  return { ok: true };
}

const STATUSES = ["new", "contacted", "won", "lost"];

export async function updateLeadStatus(fd: FormData) {
  const user = await requireUser();
  assertCan(user, "leads.manage");
  const status = str(fd, "status");
  if (!status || !STATUSES.includes(status)) return;
  await db
    .update(leads)
    .set({ status })
    .where(and(eq(leads.id, str(fd, "leadId") ?? ""), eq(leads.orgId, user.orgId)));
  revalidatePath("/leads");
}
