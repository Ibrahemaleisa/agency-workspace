"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ar as arLocale, enUS } from "date-fns/locale";
import { AtSign, BadgeCheck, Bell, FolderKanban, MessageSquare, MessagesSquare, RefreshCw, Sparkles, UserPlus } from "lucide-react";
import { cn } from "./ui";
import type { Lang } from "@/lib/i18n";
import { markAllNotificationsRead, markNotificationRead } from "@/server/admin-actions";

type Item = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
};

const ICONS: Record<string, typeof Bell> = {
  assigned: UserPlus,
  mention: AtSign,
  comment: MessageSquare,
  chat: MessageSquare,
  team_chat: MessagesSquare,
  status: RefreshCw,
  approval: BadgeCheck,
  project: FolderKanban,
  lead: Sparkles,
};

/** Bell button with unread count and a dropdown of the latest notifications. */
export function NotificationBell({
  initialUnread,
  lang,
  labels,
  tone = "light",
}: {
  initialUnread: number;
  lang: Lang;
  labels: { title: string; viewAll: string; empty: string; markAll: string };
  tone?: "light" | "dark";
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[] | null>(null);
  const unread = useUnread(initialUnread, open);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close on navigation.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch("/api/notifications", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => !cancelled && d && setItems(d.items))
      .catch(() => {});
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      cancelled = true;
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const locale = lang === "ar" ? arLocale : enUS;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={labels.title}
        aria-expanded={open}
        data-testid="notification-bell"
        className={cn(
          "relative flex size-9 items-center justify-center rounded-full transition",
          tone === "dark" ? "text-zinc-300 hover:bg-white/10 hover:text-white" : "text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-100 hover:text-ink bg-white",
        )}
      >
        <Bell className="size-[18px]" />
        {unread > 0 && (
          <span className="absolute -top-1 -end-1 min-w-[18px] rounded-full bg-red-500 px-1 text-center text-[10px] leading-[18px] font-semibold text-white tabular-nums">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-3 top-16 z-50 overflow-hidden rounded-2xl border border-zinc-200 bg-white text-zinc-900 shadow-2xl sm:absolute sm:inset-x-auto sm:end-0 sm:top-11 sm:w-96">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
            <span className="text-sm font-semibold">{labels.title}</span>
            {unread > 0 && (
              <form action={markAllNotificationsRead} onSubmit={() => setItems((xs) => xs?.map((x) => ({ ...x, read: true })) ?? null)}>
                <button className="text-xs font-medium text-zinc-500 hover:text-ink">{labels.markAll}</button>
              </form>
            )}
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {items === null ? (
              <div className="space-y-2 p-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-10 animate-pulse rounded-lg bg-zinc-100" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-zinc-500">{labels.empty}</p>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {items.map((n) => {
                  const Icon = ICONS[n.type] ?? Bell;
                  return (
                    <li key={n.id}>
                      <form action={markNotificationRead}>
                        <input type="hidden" name="id" value={n.id} />
                        <input type="hidden" name="link" value={n.link ?? ""} />
                        <button className={cn("flex w-full items-start gap-3 px-4 py-3 text-start hover:bg-zinc-50", !n.read && "bg-sand-50")}>
                          <span className={cn("mt-0.5 rounded-md p-1.5", n.read ? "bg-zinc-100 text-zinc-500" : "bg-ink text-sand-200")}>
                            <Icon className="size-3.5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className={cn("block text-sm leading-snug", n.read ? "text-zinc-600" : "font-medium")}>{n.title}</span>
                            {n.body && <span dir="auto" className="mt-0.5 line-clamp-2 block text-xs text-zinc-500">{n.body}</span>}
                            <span className="mt-0.5 block text-[11px] text-zinc-400">
                              {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale })}
                            </span>
                          </span>
                          {!n.read && <span className="mt-2 size-2 shrink-0 rounded-full bg-red-500" />}
                        </button>
                      </form>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <Link href="/notifications" className="block border-t border-zinc-100 px-4 py-3 text-center text-sm font-medium text-ink hover:bg-zinc-50">
            {labels.viewAll}
          </Link>
        </div>
      )}
    </div>
  );
}

/** Poll the unread count so the badge stays fresh without full page reloads. */
export function useUnread(initial: number, refreshKey?: unknown) {
  const [count, setCount] = useState(initial);
  const [lastInitial, setLastInitial] = useState(initial);
  if (initial !== lastInitial) {
    setLastInitial(initial);
    setCount(initial);
  }
  useEffect(() => {
    const load = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/notifications/count", { cache: "no-store" });
        if (res.ok) setCount((await res.json()).unread);
      } catch {}
    };
    const id = setInterval(load, 20000);
    return () => clearInterval(id);
  }, [refreshKey]);
  return count;
}
