import type { NavItem } from "@/components/sidebar";
import type { AppDict } from "./i18n-app";
import { can, type Permission } from "./permissions";
import { isPlatform } from "./platform";
import type { Role } from "@/db/schema";

type Entry = Omit<NavItem, "label" | "section"> & {
  key: keyof AppDict["nav"];
  section?: "sectionAgency" | "sectionSettings" | "sectionHelp";
  permission?: Permission;
};

/** Sidebar entries, each gated by a permission (or visible to everyone when omitted). */
const NAV: Entry[] = [
  { href: "/", key: "dashboard", icon: "dashboard" },
  { href: "/projects", key: "projects", icon: "projects" },
  { href: "/tasks", key: "tasks", icon: "tasks", permission: "tasks.updateStatus" },
  { href: "/calendar", key: "calendar", icon: "calendar", permission: "tasks.updateStatus" },
  { href: "/approvals", key: "approvals", icon: "approvals" },
  { href: "/notifications", key: "notifications", icon: "notifications" },
  { href: "/chat", key: "teamChat", icon: "teamChat", permission: "chat.internal" },
  { href: "/clients", key: "clients", icon: "clients", permission: "clients.view", section: "sectionAgency" },
  { href: "/leads", key: "leads", icon: "leads", permission: "leads.manage", section: "sectionAgency" },
  { href: "/activity", key: "activity", icon: "activity", permission: "activity.viewAll", section: "sectionAgency" },
  { href: "/team", key: "team", icon: "team", permission: "users.manage", section: "sectionSettings" },
  { href: "/templates", key: "templates", icon: "templates", permission: "templates.manage", section: "sectionSettings" },
  { href: "/settings/brand", key: "brand", icon: "brand", permission: "brand.manage", section: "sectionSettings" },
  { href: "/settings/billing", key: "billing", icon: "billing", permission: "billing.manage", section: "sectionSettings" },
  { href: "/settings", key: "settings", icon: "settings", section: "sectionSettings" },
  { href: "/guide", key: "guide", icon: "guide", section: "sectionHelp" },
];

export function navFor(user: { role: Role }, t: AppDict): NavItem[] {
  // Billing exists only on the Operra platform; single-agency deployments are billed outside the app.
  return NAV.filter((i) => (!i.permission || can(user, i.permission)) && (i.key !== "billing" || isPlatform())).map((i) => ({
    href: i.href,
    icon: i.icon,
    label: t.nav[i.key] as string,
    section: i.section ? (t.nav[i.section] as string) : undefined,
  }));
}
