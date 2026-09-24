import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { attachments, projects, tasks } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { isUuid, taskScope } from "@/lib/access";
import { loadFile } from "@/lib/uploads";

// Raster images may be shown inline (thumbnails / previews); everything else downloads.
const INLINE_TYPES = new Set(["image/png", "image/jpeg", "image/gif", "image/webp", "image/avif"]);

export async function GET(req: Request, ctx: RouteContext<"/api/files/[id]">) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const { id } = await ctx.params;
  if (!isUuid(id)) return new Response("Not found", { status: 404 });

  const [row] = await db
    .select({ att: attachments })
    .from(attachments)
    .innerJoin(tasks, eq(tasks.id, attachments.taskId))
    .innerJoin(projects, eq(projects.id, tasks.projectId))
    .where(
      and(
        eq(attachments.id, id),
        taskScope(user),
        user.role === "client" ? eq(attachments.clientVisible, true) : undefined,
      ),
    )
    .limit(1);
  if (!row) return new Response("Not found", { status: 404 });

  const body = await loadFile(row.att.storageKey);
  if (!body) return new Response("File missing", { status: 404 });
  const inline = new URL(req.url).searchParams.has("inline") && INLINE_TYPES.has(row.att.mimeType);
  return new Response(body as BodyInit, {
    headers: {
      "Cache-Control": "private, max-age=3600",
      "Content-Type": row.att.mimeType,
      "Content-Length": String(row.att.size),
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(row.att.fileName)}`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
