import type { Role } from "@/db/schema";

/**
 * Central role → permission policy.
 *
 * UI and server actions ask `can(user, "permission")` instead of checking roles directly,
 * so changing what a role may do is a one-line change here.
 * Resource-level scoping (which projects/tasks a user may see) lives in `lib/access.ts`.
 */
export const PERMISSIONS = [
  "users.manage",
  "clients.view",
  "clients.manage",
  "projects.viewAll",
  "projects.manage", // create/edit projects, members, modules
  "templates.manage",
  "tasks.create",
  "tasks.edit", // title, description, priority, due date, stage
  "tasks.assign",
  "tasks.delete",
  "tasks.updateStatus",
  "tasks.setClientVisibility", // share tasks/files with client, request approvals
  "comments.internal",
  "comments.client",
  "files.upload",
  "chat.internal",
  "chat.client",
  "approvals.decide",
  "approvals.override", // complete an approval task without the client's approval
  "activity.viewAll",
  "leads.manage", // landing-page project requests
  "brand.manage", // white-label brand settings
  "billing.manage", // plan, subscription and payment
  "users.invite", // email invitations
  "dashboard.admin",
  "dashboard.employee",
  "dashboard.client",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  admin: PERMISSIONS.filter((p) => p !== "dashboard.employee" && p !== "dashboard.client"),
  employee: [
    "tasks.create",
    "tasks.edit",
    "tasks.updateStatus",
    "tasks.setClientVisibility",
    "comments.internal",
    "comments.client",
    "files.upload",
    "chat.internal",
    "chat.client",
    "dashboard.employee",
  ],
  client: ["comments.client", "chat.client", "approvals.decide", "dashboard.client"],
};

const roleSets = Object.fromEntries(
  Object.entries(ROLE_PERMISSIONS).map(([role, perms]) => [role, new Set(perms)]),
) as Record<Role, Set<Permission>>;

export function can(user: { role: Role } | null | undefined, permission: Permission): boolean {
  if (!user) return false;
  return roleSets[user.role].has(permission);
}

export class ForbiddenError extends Error {
  constructor(message = "You do not have permission to do that.") {
    super(message);
  }
}

export function assertCan(user: { role: Role }, permission: Permission) {
  if (!can(user, permission)) throw new ForbiddenError();
}

/** Internal = agency staff (admin/employee), as opposed to client users. */
export function isInternal(user: { role: Role }) {
  return user.role !== "client";
}
