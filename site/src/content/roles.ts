import type { ShotKey } from "./shots";

/**
 * Who Operra is for, from the brand system's audiences (Buyer, Champion, Daily users, Guests),
 * each mapped to the product role that exists today: Admin, Team member or Client.
 * Everything listed under `does` is shipped behaviour for that role.
 */
export type Audience = {
  id: "buyer" | "champion" | "daily" | "guest";
  audience: string;
  who: string;
  wants: string;
  productRole: "Admin" | "Team member" | "Client";
  does: string[];
  shot: ShotKey;
};

export const AUDIENCES: Audience[] = [
  {
    id: "buyer",
    audience: "Buyer",
    who: "Founders and managing directors",
    wants: "Control of the business without being in every chat.",
    productRole: "Admin",
    does: [
      "The whole agency on one dashboard: overdue work, pending approvals, unassigned tasks",
      "Project health matrix: on track, at risk, off track",
      "The full activity log, and leads from your public page",
    ],
    shot: "dashboard",
  },
  {
    id: "champion",
    audience: "Champion",
    who: "Heads of ops and account directors",
    wants: "The Sunday chaos gone.",
    productRole: "Admin",
    does: [
      "Set up clients, projects and team access",
      "Define module templates once — stages, fields, client approvals",
      "Assign work and see each person’s load",
    ],
    shot: "templates",
  },
  {
    id: "daily",
    audience: "Daily users",
    who: "Account managers, producers, designers, media buyers",
    wants: "Fewer pings and a clear next step.",
    productRole: "Team member",
    does: [
      "Their own dashboard: open tasks, due today, overdue, waiting on them",
      "Update status, comment with @mentions, upload files",
      "Share work with the client and request approval",
    ],
    shot: "employeeDashboard",
  },
  {
    id: "guest",
    audience: "Guests",
    who: "Your clients",
    wants: "To see progress and approve without chasing.",
    productRole: "Client",
    does: [
      "Only their own projects, and the tasks and files you share",
      "Approve, or request changes with feedback",
      "A client channel with your team — never your internal notes",
    ],
    shot: "clientDashboard",
  },
];

/** "Your role" on the trial form, in the same audience language. */
export const TRIAL_ROLES = [
  "Founder / managing director",
  "Head of ops / account director",
  "Account manager, producer, designer or media buyer",
  "Other",
] as const;
