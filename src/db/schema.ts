import {
  pgTable,
  pgEnum,
  text,
  uuid,
  timestamp,
  boolean,
  integer,
  jsonb,
  date,
  primaryKey,
  index,
  uniqueIndex,
  customType,
} from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer; driverData: Buffer }>({ dataType: () => "bytea" });

/* ------------------------------------------------------------------ */
/* Enums                                                               */
/* ------------------------------------------------------------------ */

export const roleEnum = pgEnum("role", ["admin", "employee", "client"]);

export const taskStatusEnum = pgEnum("task_status", [
  "todo",
  "in_progress",
  "review",
  "waiting_client",
  "completed",
]);

export const priorityEnum = pgEnum("priority", ["low", "medium", "high", "urgent"]);

export const projectStatusEnum = pgEnum("project_status", [
  "planning",
  "active",
  "on_hold",
  "completed",
  "cancelled",
]);

export const approvalStatusEnum = pgEnum("approval_status", [
  "none",
  "pending",
  "approved",
  "rejected",
]);

export const chatChannelEnum = pgEnum("chat_channel", ["internal", "client"]);

/* ------------------------------------------------------------------ */
/* Shared JSON types                                                   */
/* ------------------------------------------------------------------ */

export type WorkflowStage = {
  name: string;
  /** Stage that requires a client decision (approve / reject). */
  clientApproval?: boolean;
};

export type ModuleField = {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "url" | "select" | "textarea";
  options?: string[];
};

/* ------------------------------------------------------------------ */
/* Tenancy + users                                                     */
/* ------------------------------------------------------------------ */

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** Brand name (English / Latin). */
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  /* ---- White-label brand settings (edited on Settings → Brand) ---- */
  nameAr: text("name_ar"),
  /** Logo as a data: URL (PNG, JPG, WebP or SVG, kept small). */
  logo: text("logo"),
  primaryColor: text("primary_color").notNull().default("#0a0a0a"),
  accentColor: text("accent_color").notNull().default("#e8dcc8"),
  defaultLang: text("default_lang").notNull().default("ar"),
  showLanding: boolean("show_landing").notNull().default(true),
  contactEmail: text("contact_email"),
  whatsapp: text("whatsapp"),
  instagram: text("instagram"),
  xHandle: text("x_handle"),
  linkedin: text("linkedin"),
  /** Client names shown on the landing page ("Trusted by"). */
  showcaseClients: jsonb("showcase_clients").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: roleEnum("role").notNull().default("employee"),
    title: text("title"),
    /** Set only for client-role users: which client company they belong to. */
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
    active: boolean("active").notNull().default(true),
    /** Language used for this user's emails (kept in sync with the AR | EN switch). */
    lang: text("lang").notNull().default("ar"),
    /** Send notifications by email as well as in the app. */
    emailNotifications: boolean("email_notifications").notNull().default(true),
    /** Last time the user opened the team chat (drives the unread badge). */
    teamChatSeenAt: timestamp("team_chat_seen_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email), index("users_org_idx").on(t.orgId)],
);

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(), // sha256 of the cookie token
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

/* ------------------------------------------------------------------ */
/* Clients                                                             */
/* ------------------------------------------------------------------ */

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    industry: text("industry"),
    contactName: text("contact_name"),
    contactEmail: text("contact_email"),
    phone: text("phone"),
    website: text("website"),
    notes: text("notes"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("clients_org_idx").on(t.orgId)],
);

/** Internal team members assigned to a client account. */
export const clientTeam = pgTable(
  "client_team",
  {
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.clientId, t.userId] })],
);

/* ------------------------------------------------------------------ */
/* Projects + modules                                                  */
/* ------------------------------------------------------------------ */

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    description: text("description"),
    status: projectStatusEnum("status").notNull().default("planning"),
    startDate: date("start_date"),
    endDate: date("end_date"),
    ownerId: uuid("owner_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("projects_org_idx").on(t.orgId), index("projects_client_idx").on(t.clientId)],
);

/** Internal users with access to a project (admins always have access). */
export const projectMembers = pgTable(
  "project_members",
  {
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.userId] })],
);

/** Reusable module definition (Content, Production, ...). */
export const moduleTemplates = pgTable(
  "module_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    color: text("color").notNull().default("slate"),
    stages: jsonb("stages").$type<WorkflowStage[]>().notNull(),
    fields: jsonb("fields").$type<ModuleField[]>().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("module_templates_org_idx").on(t.orgId)],
);

/** A module instance attached to a project. Stages/fields are snapshotted from the template. */
export const projectModules = pgTable(
  "project_modules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    templateId: uuid("template_id").references(() => moduleTemplates.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    color: text("color").notNull().default("slate"),
    stages: jsonb("stages").$type<WorkflowStage[]>().notNull(),
    fields: jsonb("fields").$type<ModuleField[]>().notNull().default([]),
    fieldValues: jsonb("field_values").$type<Record<string, string>>().notNull().default({}),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("project_modules_project_idx").on(t.projectId)],
);

/* ------------------------------------------------------------------ */
/* Tasks                                                               */
/* ------------------------------------------------------------------ */

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    moduleId: uuid("module_id").references(() => projectModules.id, { onDelete: "set null" }),
    /** Workflow stage within the module (e.g. "Writing"). */
    stage: text("stage"),
    title: text("title").notNull(),
    description: text("description"),
    assigneeId: uuid("assignee_id").references(() => users.id, { onDelete: "set null" }),
    status: taskStatusEnum("status").notNull().default("todo"),
    priority: priorityEnum("priority").notNull().default("medium"),
    dueDate: date("due_date"),
    /** Visible to client users on the portal (deliverables, approvals). */
    clientVisible: boolean("client_visible").notNull().default(false),
    requiresApproval: boolean("requires_approval").notNull().default(false),
    approvalStatus: approvalStatusEnum("approval_status").notNull().default("none"),
    createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("tasks_org_idx").on(t.orgId),
    index("tasks_project_idx").on(t.projectId),
    index("tasks_assignee_idx").on(t.assigneeId),
  ],
);

export const taskComments = pgTable(
  "task_comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
    body: text("body").notNull(),
    /** Internal notes are never shown to client users. */
    internal: boolean("internal").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("task_comments_task_idx").on(t.taskId)],
);

export const attachments = pgTable(
  "attachments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    uploaderId: uuid("uploader_id").references(() => users.id, { onDelete: "set null" }),
    fileName: text("file_name").notNull(),
    storageKey: text("storage_key").notNull(),
    mimeType: text("mime_type").notNull(),
    size: integer("size").notNull(),
    /** Deliverable shared with the client. */
    clientVisible: boolean("client_visible").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("attachments_task_idx").on(t.taskId)],
);

/** Project requests submitted from the public landing page. */
export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    company: text("company"),
    email: text("email"),
    phone: text("phone"),
    service: text("service"),
    message: text("message"),
    lang: text("lang").notNull().default("ar"),
    status: text("status").notNull().default("new"), // new | contacted | won | lost
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("leads_org_idx").on(t.orgId, t.createdAt)],
);

/** File contents, used for uploads when no external file store is configured. */
export const fileBlobs = pgTable("file_blobs", {
  key: text("key").primaryKey(),
  data: bytea("data").notNull(),
});

/* ------------------------------------------------------------------ */
/* Collaboration                                                       */
/* ------------------------------------------------------------------ */

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
    channel: chatChannelEnum("channel").notNull().default("internal"),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("chat_messages_project_idx").on(t.projectId, t.channel)],
);

/** Org-wide chat for agency staff (admins + employees). */
export const teamMessages = pgTable(
  "team_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("team_messages_org_idx").on(t.orgId, t.createdAt)],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    type: text("type").notNull(), // assigned | mention | comment | status | approval | chat
    title: text("title").notNull(),
    /** Arabic version of the title (the English one is in `title`). */
    titleAr: text("title_ar"),
    /** Optional excerpt, e.g. the comment or message that triggered it. */
    body: text("body"),
    link: text("link"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notifications_user_idx").on(t.userId, t.readAt)],
);

export const activityLog = pgTable(
  "activity_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
    taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }),
    action: text("action").notNull(), // task.created, task.status, comment.added, ...
    summary: text("summary").notNull(),
    /** Whether this entry may be shown to the client on their portal. */
    clientVisible: boolean("client_visible").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("activity_org_idx").on(t.orgId, t.createdAt),
    index("activity_project_idx").on(t.projectId),
    index("activity_task_idx").on(t.taskId),
  ],
);

export type User = typeof users.$inferSelect;
export type Role = (typeof roleEnum.enumValues)[number];
export type TaskStatus = (typeof taskStatusEnum.enumValues)[number];
export type Priority = (typeof priorityEnum.enumValues)[number];
export type ProjectStatus = (typeof projectStatusEnum.enumValues)[number];
export type Task = typeof tasks.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type ProjectModule = typeof projectModules.$inferSelect;
export type ModuleTemplate = typeof moduleTemplates.$inferSelect;
