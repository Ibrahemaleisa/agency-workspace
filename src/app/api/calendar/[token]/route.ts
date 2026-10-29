import { eq } from "drizzle-orm";
import { addDays, format } from "date-fns";
import { db } from "@/db";
import { organizations, users } from "@/db/schema";
import { hashToken } from "@/lib/auth";
import { appUrl } from "@/lib/platform";
import { listTasks } from "@/server/queries";

export const dynamic = "force-dynamic";

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
/** iCalendar lines are folded at 75 octets. */
const fold = (line: string) => {
  const out: string[] = [];
  let rest = line;
  while (Buffer.byteLength(rest) > 75) {
    let cut = 75;
    while (Buffer.byteLength(rest.slice(0, cut)) > 75) cut--;
    out.push(rest.slice(0, cut));
    rest = " " + rest.slice(cut);
  }
  out.push(rest);
  return out.join("\r\n");
};

/**
 * GET /api/calendar/{secret} — a person's task deadlines as an iCalendar feed (all-day events), for
 * Google Calendar, Outlook or Apple Calendar. The secret is the only credential; it is stored hashed
 * and can be replaced or switched off on the Calendar page.
 */
export async function GET(_req: Request, ctx: RouteContext<"/api/calendar/[token]">) {
  const { token } = await ctx.params;
  const secret = token.replace(/\.ics$/, "");
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(secret)) return new Response("Not found", { status: 404 });
  const user = await db.query.users.findFirst({ where: eq(users.calendarTokenHash, hashToken(secret)) });
  if (!user || !user.active) return new Response("Not found", { status: 404 });
  const org = await db.query.organizations.findFirst({ where: eq(organizations.id, user.orgId) });
  if (!org || org.status !== "active") return new Response("Not found", { status: 404 });

  const now = new Date();
  const rows = await listTasks(
    { ...user, readOnly: true },
    {
      dueFrom: format(addDays(now, -60), "yyyy-MM-dd"),
      dueTo: format(addDays(now, 366), "yyyy-MM-dd"),
      ...(user.role === "client" ? {} : { assigneeId: user.id }),
      limit: 2000,
    },
  );
  const base = appUrl();
  const stamp = format(now, "yyyyMMdd'T'HHmmss'Z'");
  const host = new URL(base).hostname;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${esc(org.name)}//Tasks//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${esc(org.name)}`,
    "X-PUBLISHED-TTL:PT1H",
  ];
  for (const t of rows) {
    if (!t.dueDate) continue;
    const day = t.dueDate.replace(/-/g, "");
    const next = format(addDays(new Date(`${t.dueDate}T00:00:00Z`), 1), "yyyyMMdd");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${t.id}@${host}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${day}`,
      `DTEND;VALUE=DATE:${next}`,
      `SUMMARY:${esc(`${t.status === "completed" ? "✓ " : ""}${t.title}`)}`,
      `DESCRIPTION:${esc(`${t.clientName} · ${t.projectName}`)}`,
      `URL:${base}/tasks/${t.id}`,
      ...(t.status === "completed" ? ["STATUS:CANCELLED"] : []),
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return new Response(lines.map(fold).join("\r\n") + "\r\n", {
    headers: { "Content-Type": "text/calendar; charset=utf-8", "Cache-Control": "private, max-age=900" },
  });
}
