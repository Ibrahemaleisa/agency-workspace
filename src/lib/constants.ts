import type { Priority, ProjectStatus, TaskStatus } from "@/db/schema";

export const TASK_STATUSES: { value: TaskStatus; label: string; tone: Tone }[] = [
  { value: "todo", label: "To Do", tone: "slate" },
  { value: "in_progress", label: "In Progress", tone: "blue" },
  { value: "review", label: "Review", tone: "violet" },
  { value: "waiting_client", label: "Waiting for Client", tone: "amber" },
  { value: "completed", label: "Completed", tone: "green" },
];

export const PRIORITIES: { value: Priority; label: string; tone: Tone }[] = [
  { value: "low", label: "Low", tone: "slate" },
  { value: "medium", label: "Medium", tone: "blue" },
  { value: "high", label: "High", tone: "amber" },
  { value: "urgent", label: "Urgent", tone: "red" },
];

export const PROJECT_STATUSES: { value: ProjectStatus; label: string; tone: Tone }[] = [
  { value: "planning", label: "Planning", tone: "slate" },
  { value: "active", label: "Active", tone: "green" },
  { value: "on_hold", label: "On Hold", tone: "amber" },
  { value: "completed", label: "Completed", tone: "blue" },
  { value: "cancelled", label: "Cancelled", tone: "red" },
];

export type Tone = "slate" | "blue" | "violet" | "amber" | "green" | "red" | "pink" | "teal";

export const TONES: Tone[] = ["slate", "blue", "violet", "amber", "green", "red", "pink", "teal"];

export const taskStatusLabel = (s: TaskStatus) => TASK_STATUSES.find((x) => x.value === s)!.label;
export const priorityLabel = (p: Priority) => PRIORITIES.find((x) => x.value === p)!.label;
export const projectStatusLabel = (s: ProjectStatus) =>
  PROJECT_STATUSES.find((x) => x.value === s)!.label;

export const ROLE_LABELS = { admin: "Admin / Manager", employee: "Employee", client: "Client" } as const;
