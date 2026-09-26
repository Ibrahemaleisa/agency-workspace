import type { ShotKey } from "./shots";
import type { IconName } from "@/components/icon";

export type FeatureTheme = {
  id: string;
  icon: IconName;
  eyebrow: string;
  title: string;
  body: string;
  bullets: string[];
  shot: ShotKey;
};

/** The eight things Operra does for an agency. Every bullet describes shipped behaviour. */
export const THEMES: FeatureTheme[] = [
  {
    id: "operations",
    icon: "layers",
    eyebrow: "One place",
    title: "Your whole agency in one workspace",
    body: "Clients, projects, tasks, approvals, chat, leads and notifications live together, and one search box finds any of them.",
    bullets: [
      "Search across tasks, projects, clients, stages and people — every word narrows the results",
      "Leads from your public page land in the same workspace",
      "Works on desktop and phone, with a bottom bar on small screens",
    ],
    shot: "dashboard",
  },
  {
    id: "workflows",
    icon: "workflow",
    eyebrow: "Reusable workflows",
    title: "Define a workflow once, run it on every project",
    body: "Module templates hold your stages and custom fields. Add a module to a project and Operra creates one task per stage, with client sign‑off stages already flagged.",
    bullets: [
      "Starter templates: Content, Production, Paid Media, Account Management",
      "Stages one per line — end a stage with * to make it a client approval",
      "Custom fields: text, number, date, link, select, long text",
    ],
    shot: "cropTemplate",
  },
  {
    id: "accountability",
    icon: "user-check",
    eyebrow: "Team accountability",
    title: "Everyone knows what’s theirs",
    body: "Every task has one assignee, a due date and a history. Workload and overdue work are visible without asking around.",
    bullets: [
      "Team workload: open and late tasks per person",
      "Task views: My tasks, Due today, Overdue, Waiting for client, Unassigned",
      "Activity log records who changed what, and when",
    ],
    shot: "cropWorkload",
  },
  {
    id: "clients",
    icon: "handshake",
    eyebrow: "Client collaboration",
    title: "A client portal without the extra tool",
    body: "Clients sign in to the same workspace and see only their projects, the tasks and files you share, and their own conversation with your team.",
    bullets: [
      "Client dashboard with their projects, progress and pending approvals",
      "Share individual files and tasks — nothing internal leaks",
      "Clients comment and chat in their own channel",
    ],
    shot: "clientDashboard",
  },
  {
    id: "approvals",
    icon: "badge-check",
    eyebrow: "Approvals",
    title: "Approvals, out of the thread",
    body: "Request approval from the task. The client reviews the deliverables and approves or requests changes with feedback — and the team hears about it immediately.",
    bullets: [
      "Approve marks the task completed",
      "Request changes sends it back to In Progress with the client’s notes",
      "One Approvals page for everything waiting on a client",
    ],
    shot: "cropClientApprove",
  },
  {
    id: "visibility",
    icon: "grid",
    eyebrow: "Project visibility",
    title: "See which projects are slipping before the client does",
    body: "The project health matrix shows every open project by task status and compares progress with time used, then rates it On track, At risk or Off track.",
    bullets: [
      "At risk: progress trails time by more than 10%, or a task is overdue",
      "Off track: trails by more than 30%, 3+ overdue tasks, or past the end date",
      "Click any cell to open exactly those tasks",
    ],
    shot: "cropMatrix",
  },
  {
    id: "communication",
    icon: "messages",
    eyebrow: "Communication",
    title: "Conversations next to the work",
    body: "Every project has two channels — one for the team, one with the client — plus an agency-wide team chat. Notifications arrive in the app and by email, in each person’s language.",
    bullets: [
      "@mention anyone to notify them; @all reaches the whole team",
      "Internal channel is never visible to the client",
      "People can switch email notifications off; in-app stays on",
    ],
    shot: "cropChat",
  },
  {
    id: "dashboards",
    icon: "dashboard",
    eyebrow: "Agency dashboards",
    title: "A dashboard for every role",
    body: "Admins see the whole agency, team members see their own work, and clients see their projects and what’s waiting for them.",
    bullets: [
      "Admin: active projects, overdue, pending approvals, in review, unassigned",
      "Team member: my open tasks, due today, overdue, waiting for me",
      "Client: projects, progress and approvals",
    ],
    shot: "cropStats",
  },
];

export type PlatformFeature = { icon: IconName; title: string; body: string };

/** Foundations that apply to the whole workspace. */
export const PLATFORM: PlatformFeature[] = [
  {
    icon: "shield",
    title: "Roles and permissions",
    body: "Admin, team member and client, enforced by one central permission system. Buttons people can’t use don’t appear.",
  },
  {
    icon: "palette",
    title: "Your brand, not ours",
    body: "Set your agency’s name, logo and colours in Settings → Brand. The sidebar, sign-in page, emails and browser icon follow.",
  },
  {
    icon: "languages",
    title: "Arabic and English",
    body: "Switch AR | EN anywhere. Arabic uses a full right-to-left layout, and each person’s emails follow their language.",
  },
  {
    icon: "database",
    title: "A dedicated database",
    body: "Every agency runs on its own deployment and its own Postgres database — your data is never mixed with anyone else’s.",
  },
  {
    icon: "globe",
    title: "Your own domain",
    body: "Run the workspace on an address like app.youragency.com, and email links point there.",
  },
  {
    icon: "mail",
    title: "Email notifications",
    body: "Send through your own SMTP account (such as Google Workspace) or Resend. Without it, notifications stay in-app.",
  },
  {
    icon: "inbox",
    title: "Public page and leads",
    body: "An optional branded page with a “Start your project” form. Requests arrive in Leads and admins are notified.",
  },
  {
    icon: "lock",
    title: "Secure by default",
    body: "Hashed passwords, secure sessions, and files served only after an access check.",
  },
];
