import { requireUser } from "@/lib/auth";
import { navFor } from "@/lib/navigation";
import { getT } from "@/lib/lang";
import { Search } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { NotificationBell } from "@/components/notification-bell";
import { unreadNotificationCount, unreadTeamMessages } from "@/server/queries";
import { can } from "@/lib/permissions";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { userOnboarding } from "@/db/schema";
import { getSaasT } from "@/lib/i18n-saas";
import { flowFor } from "@/lib/onboarding";
import { TOUR_TARGETS } from "@/lib/tour";
import { saveTourProgress } from "@/server/onboarding-actions";
import { TourClient as Tour } from "@/components/tour-client";
import { DemoBar } from "@/components/demo-bar";
import { isDemoCopy } from "@/lib/demo-sandbox";
import { DEMO_DICT } from "@/lib/i18n-demo";
import { getOrgById } from "@/lib/tenant";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  const [{ t, lang, brand }, { t: st }, org] = await Promise.all([getT(), getSaasT(), getOrgById(user.orgId)]);

  // Tutorial: saved per user; read-only sessions keep it in the tab only.
  const onboarding = user.readOnly ? null : await db.query.userOnboarding.findFirst({ where: eq(userOnboarding.userId, user.id) });
  const flow = user.readOnly ? flowFor(user.role, user.focus) : onboarding?.status === "active" ? (onboarding.flow as keyof typeof TOUR_TARGETS) : null;
  const tourSteps = flow
    ? st.tour.flows[flow].map((c, i) => ({ ...c, ...(TOUR_TARGETS[flow][i] ?? {}) }))
    : null;
  const [unread, chatUnread] = await Promise.all([
    unreadNotificationCount(user.id),
    can(user, "chat.internal") ? unreadTeamMessages(user) : 0,
  ]);
  const items = navFor(user, t).map((i) => (i.icon === "teamChat" ? { ...i, badge: chatUnread } : i));
  const bell = { title: t.bell.title, viewAll: t.bell.viewAll, empty: t.bell.empty, markAll: t.bell.markAll };
  return (
    <div className="min-h-screen">
      {tourSteps && (
        <Tour
          steps={tourSteps}
          initialStep={onboarding?.step ?? 0}
          save={user.readOnly ? undefined : saveTourProgress}
          labels={{ next: st.tour.next, back: st.tour.back, skip: st.tour.skip, finish: st.tour.finish, stepOf: st.tour.stepOf }}
        />
      )}
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
        {isDemoCopy(org) && <DemoBar role={user.role} canBrand={can(user, "brand.manage")} t={DEMO_DICT[lang].bar} />}
        {/* Desktop top bar: global search + notifications */}
        <div className="sticky top-0 z-10 hidden items-center justify-end gap-3 border-b border-zinc-200/70 bg-[#f6f5f2]/80 px-8 py-2.5 backdrop-blur-md md:flex">
          <form action="/search" role="search" className="relative w-80" data-tour="search">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <input
              name="q"
              type="search"
              placeholder={t.search.placeholder}
              aria-label={t.nav.search}
              className="block w-full rounded-full border-0 bg-white py-2 ps-9 pe-4 text-sm shadow-xs ring-1 ring-zinc-200 ring-inset placeholder:text-zinc-400 focus:ring-2 focus:ring-ink focus:outline-none"
            />
          </form>
          <div data-tour="bell">
            <NotificationBell initialUnread={unread} lang={lang} labels={bell} />
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 pt-5 pb-28 md:px-8 md:py-8">{children}</div>
      </main>
    </div>
  );
}
