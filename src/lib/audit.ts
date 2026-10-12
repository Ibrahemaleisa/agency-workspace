import "server-only";
import { db } from "@/db";
import { platformAudit } from "@/db/schema";

/**
 * Records a change made by Operra staff (or a destructive change made by a customer, such as
 * deleting their workspace) in the control center's audit log. Never breaks the action it's in.
 */
export async function audit(entry: {
  adminEmail: string;
  action: string;
  orgId?: string | null;
  target?: string | null;
  meta?: Record<string, string | number | boolean | null>;
}) {
  try {
    await db.insert(platformAudit).values({
      adminEmail: entry.adminEmail,
      action: entry.action,
      orgId: entry.orgId ?? null,
      target: entry.target ?? null,
      meta: entry.meta ?? null,
    });
  } catch (err) {
    console.error("[audit] could not record", entry.action, err);
  }
  console.info("[audit]", entry.action, { by: entry.adminEmail, target: entry.target ?? null });
}
