"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";
import { logActivity } from "@/lib/events";
import { HEX } from "@/lib/brand";
import { bool, str, type ActionState } from "@/lib/action-state";
import { getT } from "@/lib/lang";

const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const MAX_LOGO_BYTES = 300 * 1024;

const url = (v: string | null) => (!v ? null : /^https?:\/\//i.test(v) ? v : `https://${v}`);

export async function updateBrand(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  assertCan(user, "brand.manage");
  const e = (await getT()).t.brandSettings.errors;

  const name = str(fd, "name");
  if (!name) return { error: e.nameRequired };
  const primaryColor = str(fd, "primaryColor") ?? "";
  const accentColor = str(fd, "accentColor") ?? "";
  if (!HEX.test(primaryColor) || !HEX.test(accentColor)) return { error: e.color };
  const contactEmail = str(fd, "contactEmail");
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) return { error: e.email };

  const changes: Partial<typeof organizations.$inferInsert> = {
    name,
    nameAr: str(fd, "nameAr"),
    primaryColor,
    accentColor,
    defaultLang: str(fd, "defaultLang") === "en" ? "en" : "ar",
    showLanding: bool(fd, "showLanding"),
    contactEmail,
    whatsapp: str(fd, "whatsapp")?.replace(/\D/g, "") || null,
    instagram: url(str(fd, "instagram")),
    xHandle: url(str(fd, "x")),
    linkedin: url(str(fd, "linkedin")),
    showcaseClients: (str(fd, "showcaseClients") ?? "")
      .split(/[\n,،]+/)
      .map((c) => c.trim())
      .filter(Boolean)
      .slice(0, 15),
  };

  const logo = fd.get("logo");
  if (bool(fd, "removeLogo")) changes.logo = null;
  else if (logo instanceof File && logo.size > 0) {
    if (!LOGO_TYPES.includes(logo.type)) return { error: e.logoType };
    if (logo.size > MAX_LOGO_BYTES) return { error: e.logoSize };
    changes.logo = `data:${logo.type};base64,${Buffer.from(await logo.arrayBuffer()).toString("base64")}`;
  }

  await db.update(organizations).set(changes).where(eq(organizations.id, user.orgId));
  await logActivity(user, { action: "brand.updated", summary: "updated the brand settings", params: {} });
  revalidatePath("/", "layout");
  return { ok: true };
}
