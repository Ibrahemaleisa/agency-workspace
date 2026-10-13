"use server";

import { isSharedDemo } from "@/lib/platform";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, inArray, isNull, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { clientLimitError, teamLimitError } from "@/lib/limits";
import {
  accounts,
  clients,
  clientTeam,
  moduleTemplates,
  notifications,
  roleEnum,
  sessions,
  users,
  type ModuleField,
  type Role,
  type WorkflowStage,
} from "@/db/schema";
import { ensureAccount } from "@/db/accounts";
import { hashPassword, requireUser } from "@/lib/auth";
import { safePath } from "@/lib/request";
import { isUuid } from "@/lib/access";
import { assertCan } from "@/lib/permissions";
import { logActivity } from "@/lib/events";
import { bool, idOf, optId, str, type ActionState } from "@/lib/action-state";
import { TONES } from "@/lib/constants";
import { getT } from "@/lib/lang";
import { emailEnabled, notificationEmail, sendEmail } from "@/lib/email";
import { parseFocus, startOnboarding } from "@/lib/onboarding";
import { TEMPLATE_LIBRARY, libraryTemplate } from "@/lib/template-library";

const msg = async () => (await getT()).t.actions;

const refresh = () => revalidatePath("/", "layout");
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

/* ------------------------------------------------------------------ */
/* Clients                                                             */
/* ------------------------------------------------------------------ */

function clientValues(fd: FormData) {
  return {
    name: str(fd, "name"),
    industry: str(fd, "industry"),
    contactName: str(fd, "contactName"),
    contactEmail: str(fd, "contactEmail"),
    phone: str(fd, "phone"),
    website: str(fd, "website"),
    notes: str(fd, "notes"),
  };
}

async function setClientTeam(orgId: string, clientId: string, ids: string[]) {
  const valid = ids.length
    ? await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.orgId, orgId), inArray(users.id, ids), ne(users.role, "client")))
    : [];
  await db.transaction(async (tx) => {
    await tx.delete(clientTeam).where(eq(clientTeam.clientId, clientId));
    if (valid.length) await tx.insert(clientTeam).values(valid.map((u) => ({ clientId, userId: u.id })));
  });
}

export async function createClient(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  assertCan(user, "clients.manage");
  const values = clientValues(fd);
  if (!values.name) return { error: (await msg()).clientNameRequired };
  const limit = await clientLimitError(user.orgId);
  if (limit) return { error: limit };
  const [client] = await db
    .insert(clients)
    .values({ ...values, name: values.name, orgId: user.orgId })
    .returning();
  await setClientTeam(user.orgId, client.id, fd.getAll("teamIds").map(String));
  await logActivity(user, { action: "client.created", summary: `added client ${client.name}`, params: { name: client.name } });
  refresh();
  redirect(`/clients/${client.id}`);
}

export async function updateClient(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  assertCan(user, "clients.manage");
  const id = idOf(fd, "clientId");
  const values = clientValues(fd);
  if (!values.name) return { error: (await msg()).clientNameRequired };
  const [client] = await db
    .update(clients)
    .set({ ...values, name: values.name, active: bool(fd, "active") })
    .where(and(eq(clients.id, id), eq(clients.orgId, user.orgId)))
    .returning();
  if (!client) return { error: (await msg()).clientNotFound };
  await setClientTeam(user.orgId, client.id, fd.getAll("teamIds").map(String));
  await logActivity(user, { action: "client.updated", summary: `updated client ${client.name}`, params: { name: client.name } });
  refresh();
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Users                                                               */
/* ------------------------------------------------------------------ */

function parseRole(v: string | null): Role {
  return v && (roleEnum.enumValues as string[]).includes(v) ? (v as Role) : "employee";
}

export async function createUser(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireUser();
  assertCan(admin, "users.manage");
  const name = str(fd, "name");
  const email = str(fd, "email")?.toLowerCase();
  const password = str(fd, "password");
  const role = parseRole(str(fd, "role"));
  const clientId = role === "client" ? optId(fd, "clientId") : null;
  if (!name || !email || !password) return { error: (await msg()).userFieldsRequired };
  if (!isEmail(email)) return { error: (await msg()).invalidEmail };
  if (password.length < 8) return { error: (await msg()).passwordLength };
  if (role === "client") {
    if (!clientId) return { error: (await msg()).clientUserNeedsClient };
    const c = await db.query.clients.findFirst({
      where: and(eq(clients.id, clientId), eq(clients.orgId, admin.orgId)),
    });
    if (!c) return { error: (await msg()).invalidClient };
  }
  if (await db.query.users.findFirst({ where: and(eq(users.orgId, admin.orgId), eq(users.email, email)) }))
    return { error: (await msg()).emailExists };
  if (role !== "client") {
    const limit = await teamLimitError(admin.orgId);
    if (limit) return { error: limit };
  }
  // Someone who already has an account elsewhere joins by invitation, with their own password.
  if (await db.query.accounts.findFirst({ where: eq(accounts.email, email) })) return { error: (await msg()).accountExists };

  const passwordHash = await hashPassword(password);
  const created = await db.transaction(async (tx) => {
    const { account } = await ensureAccount(tx, email, passwordHash);
    const [u] = await tx
      .insert(users)
      .values({
        orgId: admin.orgId,
        accountId: account.id,
        name,
        email: account.email,
        role,
        title: str(fd, "title"),
        focus: role === "employee" ? parseFocus(str(fd, "focus")) : null,
        clientId,
      })
      .returning();
    return u;
  });
  // Their first sign-in opens the tutorial for their role.
  await startOnboarding(created);
  await logActivity(admin, { action: "user.created", summary: `added user ${name} (${role})`, params: { name, role } });
  refresh();
  return { ok: true };
}

export async function updateUser(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireUser();
  assertCan(admin, "users.manage");
  const id = idOf(fd, "userId");
  const target = await db.query.users.findFirst({
    where: and(eq(users.id, id), eq(users.orgId, admin.orgId)),
  });
  if (!target) return { error: (await msg()).userNotFound };
  const name = str(fd, "name");
  if (!name) return { error: (await msg()).nameRequired };
  const role = parseRole(str(fd, "role"));
  const active = bool(fd, "active");
  if (target.id === admin.id && (role !== "admin" || !active))
    return { error: (await msg()).ownAdmin };
  const clientId = role === "client" ? optId(fd, "clientId") : null;
  if (role === "client") {
    if (!clientId) return { error: (await msg()).clientUserNeedsClient };
    const c = await db.query.clients.findFirst({ where: and(eq(clients.id, clientId), eq(clients.orgId, admin.orgId)) });
    if (!c) return { error: (await msg()).invalidClient };
  }

  const password = str(fd, "password");
  if (password && password.length < 8) return { error: (await msg()).passwordLength };
  // Re-activating someone, or moving a client user into the team, takes a team seat.
  const takesSeat = role !== "client" && active && (target.role === "client" || !target.active);
  if (takesSeat) {
    const limit = await teamLimitError(admin.orgId, { countInvites: false });
    if (limit) return { error: limit };
  }

  const email = str(fd, "email")?.toLowerCase() ?? target.email;
  const emailChanged = email !== target.email;
  // Public demo (demo logins shown on the sign-in page): visitors share these accounts, so nobody
  // may lock the others out by changing credentials, roles or account status.
  if (isSharedDemo() && (password || emailChanged || !active || role !== target.role))
    return { error: (await msg()).demoLocked };
  if (emailChanged || password) {
    // Email and password belong to the person, not to this agency: an admin may only change them
    // when this is the person's one and only workspace.
    const [{ n }] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(users)
      .where(and(eq(users.accountId, target.accountId), ne(users.id, target.id)));
    if (n > 0) return { error: (await msg()).sharedAccount };
  }
  if (emailChanged) {
    if (!isEmail(email)) return { error: (await msg()).invalidEmail };
    const taken = await db.query.accounts.findFirst({ where: and(eq(accounts.email, email), ne(accounts.id, target.accountId)) });
    if (taken) return { error: (await msg()).emailExists };
  }

  await db.transaction(async (tx) => {
    if (emailChanged || password) {
      await tx
        .update(accounts)
        .set({
          ...(emailChanged ? { email, emailVerifiedAt: null } : {}),
          ...(password ? { passwordHash: await hashPassword(password) } : {}),
          updatedAt: new Date(),
        })
        .where(eq(accounts.id, target.accountId));
    }
    await tx
      .update(users)
      .set({
        name,
        email,
        // A new (real) address gets email notifications switched on.
        ...(emailChanged ? { emailNotifications: true } : {}),
        role,
        title: str(fd, "title"),
        clientId,
        active,
      })
      .where(eq(users.id, target.id));
  });
  if (!active || password) await db.delete(sessions).where(eq(sessions.userId, target.id));
  await logActivity(admin, { action: "user.updated", summary: `updated user ${name}`, params: { name } });
  refresh();
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Module templates                                                    */
/* ------------------------------------------------------------------ */

const FIELD_TYPES: ModuleField["type"][] = ["text", "number", "date", "url", "select", "textarea"];
const FIELD_KEY = /^[A-Za-z][A-Za-z0-9_]{0,62}$/;

/** A stable key from a label ("Shoot date" → "shootDate"); empty for labels without Latin letters. */
const keyFromLabel = (label: string) =>
  label
    .toLowerCase()
    .replace(/[^a-z0-9]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ""))
    .replace(/^[^a-z]+/, "");

function parseJsonList(fd: FormData, name: string): unknown[] | null {
  const raw = str(fd, name);
  if (raw === null) return null;
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

/**
 * The template editor posts stages and fields as JSON (stagesJson / fieldsJson). The older text
 * format is still read: stages one per line (" *" marks client approval), fields as "Label | type | a, b".
 * Fields keep the key they were saved with, so values already filled in survive a rename.
 */
function parseTemplateForm(fd: FormData) {
  const name = str(fd, "name");

  const stageRows = parseJsonList(fd, "stagesJson");
  const stages: WorkflowStage[] = (
    stageRows ??
    (str(fd, "stages") ?? "").split("\n").map((l) => ({ name: l.trim().replace(/\*$/, ""), clientApproval: l.trim().endsWith("*") }))
  )
    .map((r) => (r && typeof r === "object" ? (r as Record<string, unknown>) : {}))
    .map((r) => ({ name: String(r.name ?? "").trim().slice(0, 120), clientApproval: r.clientApproval === true }))
    .filter((r) => r.name)
    .map((r) => ({ name: r.name, ...(r.clientApproval ? { clientApproval: true } : {}) }));

  const fieldRows =
    parseJsonList(fd, "fieldsJson") ??
    (str(fd, "fields") ?? "")
      .split("\n")
      .map((l) => l.split("|").map((p) => p.trim()))
      .map(([label, type, options]) => ({ label, type, options: (options ?? "").split(",") }));
  const used = new Set<string>();
  const fields: ModuleField[] = fieldRows
    .map((r) => (r && typeof r === "object" ? (r as Record<string, unknown>) : {}))
    .map((r) => ({
      key: typeof r.key === "string" ? r.key : "",
      label: String(r.label ?? "").trim().slice(0, 120),
      type: FIELD_TYPES.includes(r.type as ModuleField["type"]) ? (r.type as ModuleField["type"]) : "text",
      options: Array.isArray(r.options) ? r.options.map((o) => String(o).trim()).filter(Boolean).slice(0, 50) : [],
    }))
    .filter((r) => r.label)
    .map((r, i) => {
      let key = FIELD_KEY.test(r.key) ? r.key : keyFromLabel(r.label) || `field${i + 1}`;
      while (used.has(key)) key = `${key}${i + 1}`;
      used.add(key);
      return { key, label: r.label, type: r.type, ...(r.type === "select" ? { options: r.options } : {}) };
    });

  const color = TONES.includes(str(fd, "color") as never) ? str(fd, "color")! : "slate";
  return { name, description: str(fd, "description"), color, stages, fields };
}

export async function saveTemplate(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  assertCan(user, "templates.manage");
  const values = parseTemplateForm(fd);
  if (!values.name) return { error: (await msg()).nameRequired };
  if (values.stages.length === 0) return { error: (await msg()).templateStagesRequired };
  const id = optId(fd, "templateId");
  if (id) {
    await db
      .update(moduleTemplates)
      .set({ ...values, name: values.name })
      .where(and(eq(moduleTemplates.id, id), eq(moduleTemplates.orgId, user.orgId)));
  } else {
    await db.insert(moduleTemplates).values({ ...values, name: values.name, orgId: user.orgId });
  }
  await logActivity(user, {
    action: "template.saved",
    summary: `${id ? "updated" : "created"} module template ${values.name}`,
    params: { name: values.name },
  });
  refresh();
  if (!id) redirect("/templates");
  return { ok: true };
}

/** Admin: add templates from the library (one, or all not yet added) in the chosen language. */
export async function addLibraryTemplates(fd: FormData) {
  const user = await requireUser();
  assertCan(user, "templates.manage");
  const lang = str(fd, "lang") === "ar" ? "ar" : "en";
  const wanted = fd.getAll("key").map(String);
  const existing = await db
    .select({ name: moduleTemplates.name, sourceKey: moduleTemplates.sourceKey })
    .from(moduleTemplates)
    .where(eq(moduleTemplates.orgId, user.orgId));
  const haveKeys = new Set(existing.map((t) => t.sourceKey).filter(Boolean));
  const haveNames = new Set(existing.map((t) => t.name.trim().toLowerCase()));
  const rows = TEMPLATE_LIBRARY.filter((t) => wanted.includes(t.key) && !haveKeys.has(t.key))
    .map((t) => libraryTemplate(t, lang))
    .filter((t) => !haveNames.has(t.name.trim().toLowerCase()))
    .map((t) => ({ ...t, orgId: user.orgId }));
  if (rows.length) {
    await db.insert(moduleTemplates).values(rows).onConflictDoNothing();
    for (const r of rows) await logActivity(user, { action: "template.saved", summary: `added module template ${r.name}`, params: { name: r.name } });
  }
  revalidatePath("/templates");
  redirect(`/templates?added=${rows.length}&tl=${lang}#library`);
}

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

export async function markNotificationRead(fd: FormData) {
  const user = await requireUser();
  const id = idOf(fd, "id");
  if (!isUuid(id)) return;
  // Follow the link stored on *this user's* notification — never a URL from the form.
  const [n] = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.id, id), eq(notifications.userId, user.id)))
    .returning({ link: notifications.link });
  refresh();
  if (n?.link) redirect(safePath(n.link));
}

export async function markAllNotificationsRead() {
  const user = await requireUser();
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, user.id), isNull(notifications.readAt)));
  refresh();
}

export async function setEmailNotifications(fd: FormData) {
  const user = await requireUser();
  await db
    .update(users)
    .set({ emailNotifications: str(fd, "on") === "1" })
    .where(eq(users.id, user.id));
  refresh();
}

/** Admin tool: send a sample notification email to check the mail settings. */
export async function sendTestEmail(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  assertCan(user, "users.manage");
  const { t, lang, brand } = await getT();
  const to = str(fd, "to")?.toLowerCase() ?? "";
  if (!isEmail(to)) return { error: t.actions.invalidEmail };
  if (!emailEnabled()) return { error: t.bell.emailNotConfigured };
  try {
    await sendEmail({
      to,
      ...notificationEmail({ lang, title: t.bell.testSubject, body: t.bell.testBody, link: "/notifications", brand }),
    });
    return { ok: true };
  } catch (err) {
    console.error("[test email failed]", err);
    return { error: `${t.bell.testFailed} ${err instanceof Error ? err.message.slice(0, 200) : ""}` };
  }
}
