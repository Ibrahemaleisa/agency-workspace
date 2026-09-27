/**
 * Site-wide settings. Everything a non-developer may need to change lives here, in
 * src/content/, or in environment variables — no copy is hard-coded in components.
 */

function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3001";
}

export const site = {
  name: "Operra",
  /** Brand tagline (the belief). The only headline that ends with a full stop. */
  tagline: "Everything moving. Nothing lost.",
  taglineAr: "كل شيء يتحرك. ولا شيء يضيع.",
  /** Descriptor (the category) — paired with the logo in first-touch contexts. */
  descriptor: "The operating system for agencies",
  descriptorAr: "نظام تشغيل الوكالات",
  description:
    "Operra runs the whole agency in one place: clients, projects, reusable workflows, tasks, client approvals, chat and dashboards — in a workspace that carries your agency’s brand.",
  descriptionAr:
    "أوبيرّا يدير وكالتك كلها من مكان واحد: العملاء والمشاريع وسير العمل القابل لإعادة الاستخدام والمهام وموافقات العميل والمحادثات واللوحات — في مساحة عمل تحمل هوية وكالتك.",
  url: siteUrl(),
  /** Legacy shared demo deployment (sample agency "Northwind Studio"), used when NEXT_PUBLIC_APP_URL is unset. */
  demoUrl: process.env.NEXT_PUBLIC_DEMO_URL ?? "https://workspace-demo-sooty.vercel.app",
  /** The demo lists its sign-in accounts on its own login page; these are the ones we point to. */
  demoAccounts: [
    { role: "Admin", email: "sara@northwind.agency" },
    { role: "Team member", email: "omar@northwind.agency" },
    { role: "Client", email: "lina@bloomcafe.com" },
  ],
  demoPassword: "password",
  /** Shown on Contact and in the footer only when set. */
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "",
} as const;

export const absoluteUrl = (path = "/") => `${site.url}${path}`;
