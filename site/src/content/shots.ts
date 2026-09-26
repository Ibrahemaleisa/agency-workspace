import type { StaticImageData } from "next/image";

import dashboard from "@/assets/product/dashboard.png";
import dashboardAr from "@/assets/product/dashboard-ar.png";
import projectOverview from "@/assets/product/project-overview.png";
import projectBoard from "@/assets/product/project-board.png";
import projectActivity from "@/assets/product/project-activity.png";
import taskRequestApproval from "@/assets/product/task-request-approval.png";
import clientTask from "@/assets/product/client-task.png";
import clientApprovals from "@/assets/product/client-approvals.png";
import clientDashboard from "@/assets/product/client-dashboard.png";
import templates from "@/assets/product/templates.png";
import clients from "@/assets/product/clients.png";
import employeeDashboard from "@/assets/product/employee-dashboard.png";
import mobileDashboard from "@/assets/product/mobile-dashboard.png";
import mobileProject from "@/assets/product/mobile-project.png";
import cropMatrix from "@/assets/product/crop-matrix.png";
import cropWorkload from "@/assets/product/crop-workload.png";
import cropStats from "@/assets/product/crop-stats.png";
import cropModuleStages from "@/assets/product/crop-module-stages.png";
import cropTemplate from "@/assets/product/crop-template.png";
import cropRequestApproval from "@/assets/product/crop-request-approval.png";
import cropClientApprove from "@/assets/product/crop-client-approve.png";
import cropChat from "@/assets/product/crop-chat.png";

export type Shot = { src: StaticImageData; alt: string; path?: string };

/**
 * Real screenshots of the product, captured from the demo workspace ("Northwind Studio",
 * sample data). `path` is the in-app address shown in the browser frame.
 */
export const shots = {
  dashboard: {
    src: dashboard,
    path: "/",
    alt: "Admin dashboard: counts of active projects, overdue tasks, pending approvals, tasks in review and unassigned tasks, above the project health matrix.",
  },
  dashboardAr: {
    src: dashboardAr,
    path: "/",
    alt: "The same admin dashboard in Arabic with a right-to-left layout.",
  },
  projectOverview: {
    src: projectOverview,
    path: "/projects/autumn-menu-launch",
    alt: "Project page for “Autumn Menu Launch”: client, timeline, owner, team and progress, with the Content module’s stages and its tasks.",
  },
  projectBoard: {
    src: projectBoard,
    path: "/projects/autumn-menu-launch?tab=tasks",
    alt: "Project task board with columns To Do, In Progress, Review, Waiting for Client and Completed.",
  },
  projectActivity: {
    src: projectActivity,
    path: "/projects/autumn-menu-launch?tab=activity",
    alt: "Project activity log listing who changed what and when.",
  },
  taskRequestApproval: {
    src: taskRequestApproval,
    path: "/tasks/paid-media-client-approval",
    alt: "Task page with a Client approval card and a “Request client approval” button, plus status, assignee, priority and due date.",
  },
  clientTask: {
    src: clientTask,
    path: "/tasks/hero-photo-selects",
    alt: "Client view of a task: “Your approval is needed” with Approve and Request changes buttons, the shared deliverable and a comment from the account manager.",
  },
  clientApprovals: {
    src: clientApprovals,
    path: "/approvals",
    alt: "Client’s Approvals page listing two items awaiting their sign‑off.",
  },
  clientDashboard: {
    src: clientDashboard,
    path: "/",
    alt: "Client dashboard showing only that client’s projects, progress and items waiting for approval.",
  },
  templates: {
    src: templates,
    path: "/templates",
    alt: "Module templates page: Content, Production, Paid Media and Account Management, each with workflow stages and fields.",
  },
  clients: { src: clients, path: "/clients", alt: "Clients list with industry, contact and projects per client." },
  employeeDashboard: {
    src: employeeDashboard,
    path: "/",
    alt: "Team member dashboard: my open tasks, due today, overdue, work waiting for me, and my projects.",
  },
  mobileDashboard: { src: mobileDashboard, path: "/", alt: "Dashboard on a phone." },
  mobileProject: { src: mobileProject, path: "/projects/autumn-menu-launch", alt: "Project page on a phone." },

  cropMatrix: {
    src: cropMatrix,
    alt: "Project health matrix: open projects by task status, progress against time used, overdue count and an On track / At risk / Off track rating.",
  },
  cropWorkload: { src: cropWorkload, alt: "Team workload: open and late tasks per person." },
  cropStats: { src: cropStats, alt: "Dashboard counters: active projects, overdue tasks, pending approvals, in review, unassigned." },
  cropModuleStages: {
    src: cropModuleStages,
    alt: "A Content module on a project: stages Brief, Writing, Design, Internal Review, Client Review, Approved, Published, with its fields.",
  },
  cropTemplate: {
    src: cropTemplate,
    alt: "Editing the Content module template: workflow stages one per line (a trailing * marks client approval) and custom fields.",
  },
  cropRequestApproval: { src: cropRequestApproval, alt: "Client approval card with “Request client approval”." },
  cropClientApprove: {
    src: cropClientApprove,
    alt: "Client’s approval card: feedback box with Approve and Request changes buttons.",
  },
  cropChat: {
    src: cropChat,
    alt: "Project chat with a Team (internal) channel and a Client conversation channel; messages use @mentions.",
  },
} satisfies Record<string, Shot>;

export type ShotKey = keyof typeof shots;
