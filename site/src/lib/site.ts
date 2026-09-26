/**
 * Site-wide settings. Everything a non-developer may need to change lives here or in
 * environment variables — no copy is hard-coded in components.
 */

function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3001";
}

export const site = {
  name: "Operra",
  tagline: "The operating system for modern agencies",
  description:
    "Operra runs your agency in one place: clients, projects, reusable workflows, tasks, client approvals, chat and dashboards — in a workspace carrying your own brand.",
  url: siteUrl(),
  /** Public demo workspace (sample agency "Northwind Studio"). */
  demoUrl: process.env.NEXT_PUBLIC_DEMO_URL ?? "https://workspace-demo-sooty.vercel.app",
  /** The demo lists its sign-in accounts on its own login page; these are the ones we point to. */
  demoAccounts: [
    { role: "Agency admin", email: "sara@northwind.agency" },
    { role: "Team member", email: "omar@northwind.agency" },
    { role: "Client", email: "lina@bloomcafe.com" },
  ],
  demoPassword: "password",
  /** Shown on Contact and in the footer only when set. */
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "",
} as const;

export const absoluteUrl = (path = "/") => `${site.url}${path}`;
