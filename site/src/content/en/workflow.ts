import type { ShotKey } from "../shots";

export type WorkflowStep = {
  id: string;
  label: string;
  title: string;
  body: string;
  points: string[];
  shot: ShotKey;
};

/**
 * The path every piece of work takes in Operra. Each step maps to a real screen and to
 * behaviour that exists in the product today.
 */
export const WORKFLOW: WorkflowStep[] = [
  {
    id: "client",
    label: "Client",
    title: "Start with the client",
    body: "Each client gets a profile: contact details, internal notes the client never sees, the team assigned to the account and every project you run for them.",
    points: ["Internal notes stay internal", "Assigned team per account", "Portal logins for the client’s people"],
    shot: "clients",
  },
  {
    id: "project",
    label: "Project",
    title: "Open a project",
    body: "Give it dates, an owner and a team. Progress is calculated from the tasks themselves, so nobody has to update a percentage by hand.",
    points: ["Planning, active, on hold, completed, cancelled", "Owner and team members", "Progress from completed tasks"],
    shot: "projectOverview",
  },
  {
    id: "module",
    label: "Module",
    title: "Add a reusable module",
    body: "Modules such as Content, Production or Paid Media carry your workflow stages and fields. Adding one creates a task for every stage, and stages that need sign‑off are flagged for the client automatically.",
    points: ["Your stages, your fields", "One task per stage, created for you", "Client-approval stages marked in the template"],
    shot: "templates",
  },
  {
    id: "task",
    label: "Task",
    title: "Assign and run the work",
    body: "Every task has an assignee, status, priority and due date, plus comments, @mentions, files and a change history. Work on a board or a list.",
    points: ["Assignee is notified in-app and by email", "Board and list views", "Overdue work shows in red"],
    shot: "projectBoard",
  },
  {
    id: "review",
    label: "Review",
    title: "Review internally, then send",
    body: "Move work to Review for an internal check. When it’s ready, share the files with the client and request their approval with an optional message.",
    points: ["Status changes notify admins and the project team", "Choose which files the client can see", "Internal comments never reach the client"],
    shot: "taskRequestApproval",
  },
  {
    id: "approval",
    label: "Approval",
    title: "The client approves in one place",
    body: "Clients sign in to their own portal, open the item, review the deliverables and approve or request changes with feedback. The team is notified immediately.",
    points: ["Approve → task completed", "Request changes → back to In Progress, with feedback", "Clients only see what you shared"],
    shot: "clientTask",
  },
  {
    id: "delivery",
    label: "Delivery",
    title: "Deliver with a full record",
    body: "Approved work closes out, the module moves to its next stage, and the activity log keeps who did what and when — for the team, and the parts that concern the client.",
    points: ["Activity log per project", "Stage-by-stage module progress", "Client sees their own updates"],
    shot: "projectActivity",
  },
];
