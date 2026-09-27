import { eq } from "drizzle-orm";
import { db } from "@/db";
import { planRequests } from "@/db/schema";
import { getPlatformAdmin } from "@/lib/platform-admin";
import { isUuid } from "@/lib/access";
import { loadFile } from "@/lib/uploads";

/** Staff only: the bank transfer receipt an agency uploaded with its plan request. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getPlatformAdmin())) return new Response("Not found", { status: 404 });
  const { id } = await params;
  if (!isUuid(id)) return new Response("Not found", { status: 404 });
  const req = await db.query.planRequests.findFirst({ where: eq(planRequests.id, id) });
  if (!req?.receiptKey) return new Response("Not found", { status: 404 });
  const data = await loadFile(req.receiptKey);
  if (!data) return new Response("Not found", { status: 404 });
  return new Response(data as BodyInit, {
    headers: {
      "Content-Type": req.receiptType ?? "application/octet-stream",
      "Content-Disposition": `inline; filename="${(req.receiptName ?? "receipt").replace(/"/g, "")}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
