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

import dashboardAr_ from "@/assets/product/ar/dashboard.png";
import projectOverviewAr_ from "@/assets/product/ar/project-overview.png";
import projectBoardAr_ from "@/assets/product/ar/project-board.png";
import projectActivityAr_ from "@/assets/product/ar/project-activity.png";
import taskRequestApprovalAr_ from "@/assets/product/ar/task-request-approval.png";
import clientTaskAr_ from "@/assets/product/ar/client-task.png";
import clientApprovalsAr_ from "@/assets/product/ar/client-approvals.png";
import clientDashboardAr_ from "@/assets/product/ar/client-dashboard.png";
import templatesAr_ from "@/assets/product/ar/templates.png";
import clientsAr_ from "@/assets/product/ar/clients.png";
import employeeDashboardAr_ from "@/assets/product/ar/employee-dashboard.png";
import mobileDashboardAr_ from "@/assets/product/ar/mobile-dashboard.png";
import mobileProjectAr_ from "@/assets/product/ar/mobile-project.png";
import cropMatrixAr_ from "@/assets/product/ar/crop-matrix.png";
import cropWorkloadAr_ from "@/assets/product/ar/crop-workload.png";
import cropStatsAr_ from "@/assets/product/ar/crop-stats.png";
import cropModuleStagesAr_ from "@/assets/product/ar/crop-module-stages.png";
import cropTemplateAr_ from "@/assets/product/ar/crop-template.png";
import cropRequestApprovalAr_ from "@/assets/product/ar/crop-request-approval.png";
import cropClientApproveAr_ from "@/assets/product/ar/crop-client-approve.png";
import cropChatAr_ from "@/assets/product/ar/crop-chat.png";

export type Shot = { src: StaticImageData; srcAr: StaticImageData; alt: string; altAr: string; path?: string };

/**
 * Real screenshots of the product, captured from the demo workspace ("Northwind Studio",
 * sample data), in English and — for /ar — in Arabic (the product's right-to-left layout).
 * `path` is the in-app address shown in the browser frame.
 */
export const shots = {
  dashboard: {
    src: dashboard,
    srcAr: dashboardAr_,
    altAr: "لوحة المدير: أعداد المشاريع النشطة والمهام المتأخرة والموافقات المعلّقة والمهام قيد المراجعة وغير المسندة، وفوقها مصفوفة صحة المشاريع.",
    path: "/",
    alt: "Admin dashboard: counts of active projects, overdue tasks, pending approvals, tasks in review and unassigned tasks, above the project health matrix.",
  },
  /** "The other language": the Arabic dashboard on the English site, the English one on /ar. */
  dashboardAr: {
    src: dashboardAr,
    srcAr: dashboard,
    altAr: "لوحة المدير نفسها بالإنجليزية، بتخطيط من اليسار إلى اليمين.",
    path: "/",
    alt: "The same admin dashboard in Arabic with a right-to-left layout.",
  },
  projectOverview: {
    src: projectOverview,
    srcAr: projectOverviewAr_,
    altAr: "صفحة مشروع «Autumn Menu Launch»: العميل والمدة والمالك والفريق ونسبة التقدّم، مع مراحل وحدة المحتوى ومهامها.",
    path: "/projects/autumn-menu-launch",
    alt: "Project page for “Autumn Menu Launch”: client, timeline, owner, team and progress, with the Content module’s stages and its tasks.",
  },
  projectBoard: {
    src: projectBoard,
    srcAr: projectBoardAr_,
    altAr: "لوحة مهام المشروع بأعمدة: للتنفيذ، قيد التنفيذ، مراجعة، بانتظار العميل، مكتملة.",
    path: "/projects/autumn-menu-launch?tab=tasks",
    alt: "Project task board with columns To Do, In Progress, Review, Waiting for Client and Completed.",
  },
  projectActivity: {
    src: projectActivity,
    srcAr: projectActivityAr_,
    altAr: "سجل نشاط المشروع: من غيّر ماذا ومتى.",
    path: "/projects/autumn-menu-launch?tab=activity",
    alt: "Project activity log listing who changed what and when.",
  },
  taskRequestApproval: {
    src: taskRequestApproval,
    srcAr: taskRequestApprovalAr_,
    altAr: "صفحة مهمة فيها بطاقة موافقة العميل وزر «طلب موافقة العميل»، مع الحالة والمسؤول والأولوية وتاريخ الاستحقاق.",
    path: "/tasks/paid-media-client-approval",
    alt: "Task page with a Client approval card and a “Request client approval” button, plus status, assignee, priority and due date.",
  },
  clientTask: {
    src: clientTask,
    srcAr: clientTaskAr_,
    altAr: "مهمة كما يراها العميل: «مطلوب موافقتك» مع زري «اعتماد» و«طلب تعديل»، والملف المشارَك وتعليق من مدير الحساب.",
    path: "/tasks/hero-photo-selects",
    alt: "Client view of a task: “Your approval is needed” with Approve and Request changes buttons, the shared deliverable and a comment from the account manager.",
  },
  clientApprovals: {
    src: clientApprovals,
    srcAr: clientApprovalsAr_,
    altAr: "صفحة الموافقات لدى العميل وفيها عنصران بانتظار اعتماده.",
    path: "/approvals",
    alt: "Client’s Approvals page listing two items awaiting their sign‑off.",
  },
  clientDashboard: {
    src: clientDashboard,
    srcAr: clientDashboardAr_,
    altAr: "لوحة العميل: مشاريعه فقط، وتقدّمها، وما ينتظر موافقته.",
    path: "/",
    alt: "Client dashboard showing only that client’s projects, progress and items waiting for approval.",
  },
  templates: {
    src: templates,
    srcAr: templatesAr_,
    altAr: "صفحة قوالب الوحدات: المحتوى والإنتاج والإعلانات المدفوعة وإدارة الحسابات، ولكلٍّ مراحل سير عمل وحقول.",
    path: "/templates",
    alt: "Module templates page: Content, Production, Paid Media and Account Management, each with workflow stages and fields.",
  },
clients: {
    src: clients,
    srcAr: clientsAr_,
    altAr: "قائمة العملاء مع القطاع وجهة الاتصال والمشاريع لكل عميل.",
    path: "/clients",
    alt: "Clients list with industry, contact and projects per client.",
  },
  employeeDashboard: {
    src: employeeDashboard,
    srcAr: employeeDashboardAr_,
    altAr: "لوحة عضو الفريق: مهامي المفتوحة، المستحقة اليوم، المتأخرة، ما ينتظرني، ومشاريعي.",
    path: "/",
    alt: "Team member dashboard: my open tasks, due today, overdue, work waiting for me, and my projects.",
  },
mobileDashboard: {
    src: mobileDashboard,
    srcAr: mobileDashboardAr_,
    altAr: "اللوحة الرئيسية على الجوال.",
    path: "/",
    alt: "Dashboard on a phone.",
  },
mobileProject: {
    src: mobileProject,
    srcAr: mobileProjectAr_,
    altAr: "صفحة مشروع على الجوال.",
    path: "/projects/autumn-menu-launch",
    alt: "Project page on a phone.",
  },

  cropMatrix: {
    src: cropMatrix,
    srcAr: cropMatrixAr_,
    altAr: "مصفوفة صحة المشاريع: المشاريع المفتوحة حسب حالة المهام، والتقدّم مقابل الوقت المستهلك، وعدد المتأخر، وتقييم: على المسار / معرّض للخطر / متعثّر.",
    alt: "Project health matrix: open projects by task status, progress against time used, overdue count and an On track / At risk / Off track rating.",
  },
cropWorkload: {
    src: cropWorkload,
    srcAr: cropWorkloadAr_,
    altAr: "ضغط العمل على الفريق: المهام المفتوحة والمتأخرة لكل شخص.",
    alt: "Team workload: open and late tasks per person.",
  },
cropStats: {
    src: cropStats,
    srcAr: cropStatsAr_,
    altAr: "عدّادات اللوحة: المشاريع النشطة، المهام المتأخرة، الموافقات المعلّقة، قيد المراجعة، غير المسندة.",
    alt: "Dashboard counters: active projects, overdue tasks, pending approvals, in review, unassigned.",
  },
  cropModuleStages: {
    src: cropModuleStages,
    srcAr: cropModuleStagesAr_,
    altAr: "وحدة المحتوى على مشروع: مراحل من الموجز إلى النشر، مع حقولها.",
    alt: "A Content module on a project: stages Brief, Writing, Design, Internal Review, Client Review, Approved, Published, with its fields.",
  },
  cropTemplate: {
    src: cropTemplate,
    srcAr: cropTemplateAr_,
    altAr: "تعديل قالب وحدة المحتوى: مرحلة في كل سطر (علامة * في النهاية لموافقة العميل) وحقول مخصّصة.",
    alt: "Editing the Content module template: workflow stages one per line (a trailing * marks client approval) and custom fields.",
  },
cropRequestApproval: {
    src: cropRequestApproval,
    srcAr: cropRequestApprovalAr_,
    altAr: "بطاقة موافقة العميل مع زر «طلب موافقة العميل».",
    alt: "Client approval card with “Request client approval”.",
  },
  cropClientApprove: {
    src: cropClientApprove,
    srcAr: cropClientApproveAr_,
    altAr: "بطاقة الموافقة لدى العميل: خانة الملاحظات مع زري «اعتماد» و«طلب تعديل».",
    alt: "Client’s approval card: feedback box with Approve and Request changes buttons.",
  },
  cropChat: {
    src: cropChat,
    srcAr: cropChatAr_,
    altAr: "محادثة المشروع بقناتين: الفريق (داخلية) والعميل، والرسائل تستخدم الإشارة @.",
    alt: "Project chat with a Team (internal) channel and a Client conversation channel; messages use @mentions.",
  },
} satisfies Record<string, Shot>;

export type ShotKey = keyof typeof shots;
