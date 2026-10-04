"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, inArray, isNull, ne } from "drizzle-orm";
import { db } from "@/db";
import {
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
import { hashPassword, requireUser } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";
import { logActivity } from "@/lib/events";
import { bool, safePath, str, type ActionState } from "@/lib/action-state";
import { TONES } from "@/lib/constants";
import { getT } from "@/lib/lang";
import { emailEnabled, notificationEmail, sendEmail } from "@/lib/email";

const msg = async () => (await getT()).t.actions;

const refresh = () => revalidatePath("/", "layout");
/** Public demo deployment (SHOW_DEMO_ACCOUNTS=true): account credentials are read-only. */
const isDemo = () => process.env.SHOW_DEMO_ACCOUNTS === "true";
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
  const [client] = await db
    .insert(clients)
    .values({ ...values, name: values.name, orgId: user.orgId })
    .returning();
  await setClientTeam(user.orgId, client.id, fd.getAll("teamIds").map(String));
  await logActivity(user, { action: "client.created", summary: `added client ${client.name}` });
  refresh();
  redirect(`/clients/${client.id}`);
}

export async function updateClient(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  assertCan(user, "clients.manage");
  const id = str(fd, "clientId") ?? "";
  const values = clientValues(fd);
  if (!values.name) return { error: (await msg()).clientNameRequired };
  const [client] = await db
    .update(clients)
    .set({ ...values, name: values.name, active: bool(fd, "active") })
    .where(and(eq(clients.id, id), eq(clients.orgId, user.orgId)))
    .returning();
  if (!client) return { error: (await msg()).clientNotFound };
  await setClientTeam(user.orgId, client.id, fd.getAll("teamIds").map(String));
  await logActivity(user, { action: "client.updated", summary: `updated client ${client.name}` });
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
  const clientId = role === "client" ? str(fd, "clientId") : null;
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
  const exists = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (exists) return { error: (await msg()).emailExists };

  await db.insert(users).values({
    orgId: admin.orgId,
    name,
    email,
    passwordHash: await hashPassword(password),
    role,
    title: str(fd, "title"),
    clientId,
  });
  await logActivity(admin, { action: "user.created", summary: `added user ${name} (${role})` });
  refresh();
  return { ok: true };
}

export async function updateUser(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireUser();
  assertCan(admin, "users.manage");
  const id = str(fd, "userId") ?? "";
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
  const clientId = role === "client" ? str(fd, "clientId") : null;
  if (role === "client") {
    if (!clientId) return { error: (await msg()).clientUserNeedsClient };
    const c = await db.query.clients.findFirst({
      where: and(eq(clients.id, clientId), eq(clients.orgId, admin.orgId)),
    });
    if (!c) return { error: (await msg()).invalidClient };
  }

  const password = str(fd, "password");
  if (password && password.length < 8) return { error: (await msg()).passwordLength };

  const email = str(fd, "email")?.toLowerCase() ?? target.email;
  const emailChanged = email !== target.email;

  // Public demo (demo logins shown on the sign-in page): visitors share the admin account,
  // so nobody may lock the others out by changing credentials or disabling accounts.
  if (isDemo() && (password || emailChanged || !active || role !== target.role))
    return { error: (await msg()).demoLocked };
  if (emailChanged) {
    if (!isEmail(email)) return { error: (await msg()).invalidEmail };
    const taken = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (taken) return { error: (await msg()).emailExists };
  }

  await db
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
      ...(password ? { passwordHash: await hashPassword(password) } : {}),
    })
    .where(eq(users.id, target.id));
  if (!active || password) await db.delete(sessions).where(eq(sessions.userId, target.id));
  await logActivity(admin, { action: "user.updated", summary: `updated user ${name}` });
  refresh();
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Module templates                                                    */
/* ------------------------------------------------------------------ */

/**
 * Stages: one per line; suffix with " *" to mark a client-approval stage.
 * Fields: one per line as "Label | type | option1, option2".
 */
function parseTemplateForm(fd: FormData) {
  const name = str(fd, "name");
  const stages: WorkflowStage[] = (str(fd, "stages") ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const clientApproval = l.endsWith("*");
      return { name: l.replace(/\*$/, "").trim(), ...(clientApproval ? { clientApproval } : {}) };
    });
  const types = ["text", "number", "date", "url", "select", "textarea"];
  const fields: ModuleField[] = (str(fd, "fields") ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [label, rawType, rawOptions] = l.split("|").map((p) => p.trim());
      const type = (types.includes(rawType) ? rawType : "text") as ModuleField["type"];
      const key = label.toLowerCase().replace(/[^a-z0-9]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ""));
      return {
        key,
        label,
        type,
        ...(type === "select" ? { options: (rawOptions ?? "").split(",").map((o) => o.trim()).filter(Boolean) } : {}),
      };
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
  const id = str(fd, "templateId");
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
  });
  refresh();
  if (!id) redirect("/templates");
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

export async function markNotificationRead(fd: FormData) {
  const user = await requireUser();
  const id = str(fd, "id") ?? "";
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.id, id), eq(notifications.userId, user.id)));
  const link = safePath(str(fd, "link"));
  refresh();
  if (link) redirect(link);
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
