import { requireUser } from "@/lib/auth";
import { navFor } from "@/lib/navigation";
import { getT } from "@/lib/lang";
import { Search } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { NotificationBell } from "@/components/notification-bell";
import { unreadNotificationCount, unreadTeamMessages } from "@/server/queries";
import { can } from "@/lib/permissions";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  const { t, lang, brand } = await getT();
  const [unread, chatUnread] = await Promise.all([
    unreadNotificationCount(user.id),
    can(user, "chat.internal") ? unreadTeamMessages(user) : 0,
  ]);
  const items = navFor(user, t).map((i) => (i.icon === "teamChat" ? { ...i, badge: chatUnread } : i));
  const bell = { title: t.bell.title, viewAll: t.bell.viewAll, empty: t.bell.empty, markAll: t.bell.markAll };
  return (
    <div className="min-h-screen">
      <Sidebar
        items={items}
        user={{ name: user.name, roleLabel: t.roles[user.role] }}
        lang={lang}
        labels={{
          more: t.nav.more,
          signOut: t.nav.signOut,
          alerts: t.nav.alerts,
          workspace: t.nav.workspace,
          close: t.nav.close,
          search: t.nav.search,
        }}
        bellLabels={bell}
        orgName={brand.name[lang]}
        logo={brand.logo}
        initialUnread={unread}
      />
      <main className="min-w-0 md:ps-64">
        {/* Desktop top bar: global search + notifications */}
        <div className="sticky top-0 z-10 hidden items-center justify-end gap-3 border-b border-zinc-200/70 bg-[#f6f5f2]/80 px-8 py-2.5 backdrop-blur-md md:flex">
          <form action="/search" role="search" className="relative w-80">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <input
              name="q"
              type="search"
              placeholder={t.search.placeholder}
              aria-label={t.nav.search}
              className="block w-full rounded-full border-0 bg-white py-2 ps-9 pe-4 text-sm shadow-xs ring-1 ring-zinc-200 ring-inset placeholder:text-zinc-400 focus:ring-2 focus:ring-ink focus:outline-none"
            />
          </form>
          <NotificationBell initialUnread={unread} lang={lang} labels={bell} />
        </div>
        <div className="mx-auto max-w-7xl px-4 pt-5 pb-28 md:px-8 md:py-8">{children}</div>
      </main>
    </div>
  );
}
