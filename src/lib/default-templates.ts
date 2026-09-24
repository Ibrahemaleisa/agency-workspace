import type { ModuleField, WorkflowStage } from "@/db/schema";

/** Starter module templates provisioned for every new agency. */
export const DEFAULT_TEMPLATES: {
  name: string;
  description: string;
  color: string;
  stages: WorkflowStage[];
  fields: ModuleField[];
}[] = [
  {
    name: "Content",
    description: "Social and editorial content from brief to publication.",
    color: "violet",
    stages: [
      { name: "Brief" },
      { name: "Writing" },
      { name: "Design" },
      { name: "Internal Review" },
      { name: "Client Review", clientApproval: true },
      { name: "Approved" },
      { name: "Published" },
    ],
    fields: [
      { key: "channels", label: "Channels", type: "text" },
      { key: "postsPerMonth", label: "Posts per month", type: "number" },
      { key: "pillars", label: "Content pillars", type: "textarea" },
      { key: "brandGuidelines", label: "Brand guidelines URL", type: "url" },
    ],
  },
  {
    name: "Production",
    description: "Photo and video production.",
    color: "pink",
    stages: [
      { name: "Brief" },
      { name: "Planning" },
      { name: "Production" },
      { name: "Editing" },
      { name: "Internal Review" },
      { name: "Client Approval", clientApproval: true },
      { name: "Delivered" },
    ],
    fields: [
      { key: "deliverableType", label: "Deliverable type", type: "select", options: ["Video", "Photo", "Video + Photo"] },
      { key: "deliverableCount", label: "Number of deliverables", type: "number" },
      { key: "shootDate", label: "Shoot date", type: "date" },
      { key: "location", label: "Location", type: "text" },
    ],
  },
  {
    name: "Paid Media",
    description: "Paid social and search campaigns.",
    color: "teal",
    stages: [
      { name: "Brief" },
      { name: "Strategy" },
      { name: "Campaign Setup" },
      { name: "Client Approval", clientApproval: true },
      { name: "Live" },
      { name: "Optimization" },
      { name: "Reporting" },
    ],
    fields: [
      { key: "platforms", label: "Platforms", type: "text" },
      { key: "monthlyBudget", label: "Monthly budget (USD)", type: "number" },
      { key: "objective", label: "Objective", type: "select", options: ["Awareness", "Traffic", "Leads", "Sales"] },
      { key: "kpi", label: "KPI target", type: "text" },
    ],
  },
  {
    name: "Account Management",
    description: "Client relationship, meetings and reporting.",
    color: "amber",
    stages: [
      { name: "Onboarding" },
      { name: "Kickoff" },
      { name: "Monthly Planning" },
      { name: "Status Meetings" },
      { name: "Monthly Report" },
      { name: "Client Review", clientApproval: true },
    ],
    fields: [
      { key: "cadence", label: "Meeting cadence", type: "select", options: ["Weekly", "Bi-weekly", "Monthly"] },
      { key: "primaryContact", label: "Primary client contact", type: "text" },
      { key: "reportingDay", label: "Reporting day", type: "text" },
      { key: "renewalDate", label: "Contract renewal date", type: "date" },
    ],
  },
];
