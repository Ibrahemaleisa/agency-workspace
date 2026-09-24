import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getLang } from "@/lib/lang";
import { unreadNotificationCount } from "@/server/queries";

/** Latest notifications for the bell dropdown, in the viewer's language. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const lang = await getLang();
  const [rows, unread] = await Promise.all([
    db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(8),
    unreadNotificationCount(user.id),
  ]);
  return NextResponse.json(
    {
      unread,
      items: rows.map((n) => ({
        id: n.id,
        type: n.type,
        title: lang === "ar" ? (n.titleAr ?? n.title) : n.title,
        body: n.body,
        link: n.link,
        read: !!n.readAt,
        createdAt: n.createdAt.toISOString(),
      })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
