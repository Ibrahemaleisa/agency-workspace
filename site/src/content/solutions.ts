import type { ShotKey } from "./shots";
import type { IconName } from "@/components/icon";

export type Stage = { name: string; clientApproval?: boolean };

export type Solution = {
  slug: string;
  icon: IconName;
  name: string;
  summary: string;
  headline: string;
  intro: string;
  /** Starter module template shipped with every workspace (mirrors the product's defaults). */
  module: { name: string; stages: Stage[]; fields: string[] };
  howItRuns: { title: string; body: string }[];
  shot: ShotKey;
};

export const SOLUTIONS: Solution[] = [
  {
    slug: "content-and-social",
    icon: "pen",
    name: "Content & social agencies",
    summary: "Monthly content calendars, from brief to published, with client review built into the flow.",
    headline: "Run every content calendar on the same workflow",
    intro:
      "Content work repeats every month: brief, write, design, review, get sign‑off, publish. Operra turns that into a module you add to each client project, so every post follows the same path and the client reviews in one place.",
    module: {
      name: "Content",
      stages: [
        { name: "Brief" },
        { name: "Writing" },
        { name: "Design" },
        { name: "Internal Review" },
        { name: "Client Review", clientApproval: true },
        { name: "Approved" },
        { name: "Published" },
      ],
      fields: ["Channels", "Posts per month", "Content pillars", "Brand guidelines URL"],
    },
    howItRuns: [
      { title: "Set it up per client", body: "Add the Content module to the client’s project and fill in channels, posts per month and pillars." },
      { title: "Work in stages", body: "Writers and designers move tasks through the board; @mentions pull in whoever is needed." },
      { title: "Client reviews once", body: "The Client Review stage is sent for approval with the shared files; feedback comes back on the task." },
    ],
    shot: "projectOverview",
  },
  {
    slug: "production-studios",
    icon: "clapperboard",
    name: "Production studios",
    summary: "Photo and video from brief to delivery, with cuts approved by the client before they ship.",
    headline: "Keep shoots, edits and client sign‑off on one timeline",
    intro:
      "Production has many hand-offs — planning, the shoot, editing, internal review — and the client’s approval at the end. Operra keeps each deliverable on a task, with files, comments and approval attached.",
    module: {
      name: "Production",
      stages: [
        { name: "Brief" },
        { name: "Planning" },
        { name: "Production" },
        { name: "Editing" },
        { name: "Internal Review" },
        { name: "Client Approval", clientApproval: true },
        { name: "Delivered" },
      ],
      fields: ["Deliverable type (Video, Photo, Video + Photo)", "Number of deliverables", "Shoot date", "Location"],
    },
    howItRuns: [
      { title: "Plan the shoot", body: "Record the deliverable type, count, shoot date and location on the module." },
      { title: "Upload and share", body: "Attach several images or files at once; tick “Share with client” only on what they should see." },
      { title: "Approve the cut", body: "The client approves or requests changes; changes send the task back to the editor with notes." },
    ],
    shot: "clientTask",
  },
  {
    slug: "performance-marketing",
    icon: "trending",
    name: "Performance & paid media",
    summary: "Campaigns from strategy to reporting, with the client approving before anything goes live.",
    headline: "Nothing goes live without the client’s approval",
    intro:
      "Paid campaigns need a clear record of what was agreed before spend starts. The Paid Media module puts client approval between setup and launch, and keeps optimisation and reporting on the same project.",
    module: {
      name: "Paid Media",
      stages: [
        { name: "Brief" },
        { name: "Strategy" },
        { name: "Campaign Setup" },
        { name: "Client Approval", clientApproval: true },
        { name: "Live" },
        { name: "Optimization" },
        { name: "Reporting" },
      ],
      fields: ["Platforms", "Monthly budget", "Objective (Awareness, Traffic, Leads, Sales)", "KPI target"],
    },
    howItRuns: [
      { title: "Capture the brief", body: "Platforms, monthly budget, objective and KPI target sit on the module, visible to the whole team." },
      { title: "Approve before launch", body: "Campaign setup goes to the client for approval; their decision is recorded on the task." },
      { title: "Keep reporting on track", body: "Optimisation and reporting are tasks with owners and due dates, so they don’t get dropped." },
    ],
    shot: "projectBoard",
  },
  {
    slug: "full-service-agencies",
    icon: "building",
    name: "Full-service & retainer agencies",
    summary: "Several disciplines on one client project, with account management and agency-wide visibility.",
    headline: "Many disciplines, one project, one view of the agency",
    intro:
      "A single launch can need content, production and paid media at once. Operra lets you combine modules on one project, run account management alongside, and see the whole agency’s health on one dashboard.",
    module: {
      name: "Account Management",
      stages: [
        { name: "Onboarding" },
        { name: "Kickoff" },
        { name: "Monthly Planning" },
        { name: "Status Meetings" },
        { name: "Monthly Report" },
        { name: "Client Review", clientApproval: true },
      ],
      fields: ["Meeting cadence", "Primary client contact", "Reporting day", "Contract renewal date"],
    },
    howItRuns: [
      { title: "Combine modules", body: "Add Content, Production and Paid Media to the same project; each keeps its own stages and progress." },
      { title: "Manage the account", body: "The Account Management module tracks onboarding, planning, meetings and monthly reports." },
      { title: "Watch the whole agency", body: "The health matrix and team workload show where projects and people are stretched." },
    ],
    shot: "dashboard",
  },
];

export const solutionBySlug = (slug: string) => SOLUTIONS.find((s) => s.slug === slug);
