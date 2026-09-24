import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { unreadNotificationCount } from "@/server/queries";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ unread: await unreadNotificationCount(user.id) });
}
