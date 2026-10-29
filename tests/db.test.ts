/**
 * Database tests: tenant isolation, role scoping, repeating tasks and workspace deletion. They create their own throw-away agencies (slug prefix "t-") and remove
 * them afterwards, so they can run against any development database — never a customer's.
 * Skipped when DATABASE_URL isn't set.
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { and, eq, like, ne, sql } from "drizzle-orm";

const enabled = !!(process.env.DATABASE_URL ?? process.env.POSTGRES_URL);

describe("database", { skip: !enabled && "DATABASE_URL not set" }, async () => {
  const { db } = await import("../src/db");
  const s = await import("../src/db/schema");
  const { getAccessibleProject, getAccessibleTask, projectScope, taskScope } = await import("../src/lib/access");
  const { listProjects, listTasks } = await import("../src/server/queries");
  const { spawnNextIfRecurring } = await import("../src/lib/recurrence");
  const { deleteOrganization } = await import("../src/lib/lifecycle");
  const { createDemoCopy, deleteDemoCopy, demoPersona } = await import("../src/lib/demo-sandbox");

  type World = Awaited<ReturnType<typeof makeAgency>>;
  const run = randomUUID().slice(0, 8);
  let A: World;
  let B: World;

  async function makeAgency(tag: string) {
    const [org] = await db.insert(s.organizations).values({ name: `Test ${tag}`, slug: `t-${run}-${tag}` }).returning();
    const account = async (who: string) =>
      (await db.insert(s.accounts).values({ email: `${who}-${tag}-${run}@example.test`, passwordHash: "x" }).returning())[0];
    const [client] = await db.insert(s.clients).values({ orgId: org.id, name: `Client ${tag}` }).returning();
    const [admin] = await db
      .insert(s.users)
      .values({ orgId: org.id, accountId: (await account("admin")).id, name: "Admin", email: `admin-${tag}-${run}@example.test`, role: "admin" })
      .returning();
    const [employee] = await db
      .insert(s.users)
      .values({ orgId: org.id, accountId: (await account("emp")).id, name: "Emp", email: `emp-${tag}-${run}@example.test`, role: "employee" })
      .returning();
    const [clientUser] = await db
      .insert(s.users)
      .values({ orgId: org.id, accountId: (await account("cli")).id, name: "Cli", email: `cli-${tag}-${run}@example.test`, role: "client", clientId: client.id })
      .returning();
    const [project] = await db.insert(s.projects).values({ orgId: org.id, clientId: client.id, name: `Project ${tag}`, ownerId: admin.id }).returning();
    const [shared] = await db
      .insert(s.tasks)
      .values({ orgId: org.id, projectId: project.id, title: `Shared ${tag}`, clientVisible: true })
      .returning();
    const [internal] = await db.insert(s.tasks).values({ orgId: org.id, projectId: project.id, title: `Internal ${tag}` }).returning();
    await db.insert(s.attachments).values({ orgId: org.id, taskId: shared.id, fileName: "a.txt", storageKey: `${org.id}/missing-${run}`, mimeType: "text/plain", size: 1234 });
    await db.insert(s.subscriptions).values({ orgId: org.id, planCode: "standard", status: "trialing", trialEndsAt: new Date(Date.now() - 86_400_000) });
    const as = (u: typeof admin) => ({ ...u, readOnly: false });
    return { org, client, project, shared, internal, admin: as(admin), employee: as(employee), clientUser: as(clientUser) };
  }

  before(async () => {
    // The plans the migrations seed; tests rely on "standard" existing.
    await db.insert(s.plans).values({ code: "standard", name: "Standard" }).onConflictDoNothing();
    A = await makeAgency("a");
    B = await makeAgency("b");
  });

  after(async () => {
    try {
      const orgs = await db.select({ id: s.organizations.id }).from(s.organizations).where(like(s.organizations.slug, `t-${run}-%`));
      for (const o of orgs) await deleteOrganization(o.id);
      await db.delete(s.invoices).where(like(s.invoices.providerInvoiceId, `%${run}%`));
      await db.delete(s.accounts).where(like(s.accounts.email, `%-${run}@example.test`));
      await db.delete(s.plans).where(eq(s.plans.code, `t${run}`)).catch(() => {});
    } finally {
      // Close the pool so the test process can exit.
      await db.$client.end({ timeout: 5 });
    }
  });

  const refuses = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
      return false;
    } catch {
      return true;
    }
  };

  it("an admin never sees another agency's projects or tasks", async () => {
    assert.ok(!(await refuses(() => getAccessibleProject(A.admin, A.project.id))));
    assert.ok(await refuses(() => getAccessibleProject(A.admin, B.project.id)));
    assert.ok(await refuses(() => getAccessibleTask(A.admin, B.shared.id)));
    assert.ok((await listProjects(A.admin)).every((p) => p.id !== B.project.id));
    assert.ok((await listTasks(A.admin)).every((t) => t.id !== B.shared.id && t.id !== B.internal.id));
    const [leak] = await db.select({ n: sql<number>`count(*)::int` }).from(s.projects).where(and(projectScope(A.admin), ne(s.projects.orgId, A.org.id)));
    assert.equal(leak.n, 0);
  });

  it("an employee only sees projects they own or belong to", async () => {
    assert.ok(await refuses(() => getAccessibleProject(A.employee, A.project.id)));
    await db.insert(s.projectMembers).values({ projectId: A.project.id, userId: A.employee.id });
    assert.ok(!(await refuses(() => getAccessibleProject(A.employee, A.project.id))));
    await db.delete(s.projectMembers).where(eq(s.projectMembers.userId, A.employee.id));
  });

  it("a client sees only their own projects' tasks that are shared with them", async () => {
    assert.ok(!(await refuses(() => getAccessibleTask(A.clientUser, A.shared.id))));
    assert.ok(await refuses(() => getAccessibleTask(A.clientUser, A.internal.id)));
    assert.ok(await refuses(() => getAccessibleTask(A.clientUser, B.shared.id)));
    const [leak] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(s.tasks)
      .innerJoin(s.projects, eq(s.projects.id, s.tasks.projectId))
      .where(and(taskScope(A.clientUser), eq(s.tasks.clientVisible, false)));
    assert.equal(leak.n, 0);
  });

  it("creates the next repeating task exactly once", async () => {
    const [t] = await db
      .insert(s.tasks)
      .values({ orgId: A.org.id, projectId: A.project.id, title: "Weekly report", recurrence: "weekly", status: "completed", dueDate: "2099-01-05" })
      .returning();
    await db.insert(s.checklistItems).values({ orgId: A.org.id, taskId: t.id, title: "Collect numbers", done: true });
    const [n1, n2] = await Promise.all([spawnNextIfRecurring(A.admin, t.id), spawnNextIfRecurring(A.admin, t.id)]);
    const created = [n1, n2].filter(Boolean);
    assert.equal(created.length, 1);
    assert.equal(created[0]!.dueDate, "2099-01-12");
    assert.equal(created[0]!.status, "todo");
    const steps = await db.select().from(s.checklistItems).where(eq(s.checklistItems.taskId, created[0]!.id));
    assert.equal(steps.length, 1);
    assert.equal(steps[0].done, false);
    assert.equal(await spawnNextIfRecurring(A.admin, t.id), null);
  });

  it("deleting a workspace removes its data and lone accounts but keeps other agencies", async () => {
    const [extra] = await db.insert(s.organizations).values({ name: "Doomed", slug: `t-${run}-doomed` }).returning();
    const [lone] = await db.insert(s.accounts).values({ email: `lone-${run}@example.test`, passwordHash: "x" }).returning();
    await db.insert(s.users).values({ orgId: extra.id, accountId: lone.id, name: "Lone", email: lone.email, role: "admin" });
    // Someone who is also in agency A keeps their account.
    await db.insert(s.users).values({ orgId: extra.id, accountId: A.admin.accountId, name: "Shared", email: `admin-a-${run}@example.test`, role: "admin" });
    const [c] = await db.insert(s.clients).values({ orgId: extra.id, name: "C" }).returning();
    await db.insert(s.projects).values({ orgId: extra.id, clientId: c.id, name: "P" });

    await deleteOrganization(extra.id);
    assert.equal((await db.select().from(s.organizations).where(eq(s.organizations.id, extra.id))).length, 0);
    assert.equal((await db.select().from(s.projects).where(eq(s.projects.orgId, extra.id))).length, 0);
    assert.equal((await db.select().from(s.accounts).where(eq(s.accounts.id, lone.id))).length, 0);
    assert.equal((await db.select().from(s.accounts).where(eq(s.accounts.id, A.admin.accountId))).length, 1);
    assert.ok(!(await refuses(() => getAccessibleProject(A.admin, A.project.id))), "other agencies untouched");
  });

  it("a visitor's demo copy is a full private agency, and only copies can be deleted as one", async () => {
    const copy = await createDemoCopy({ name: "Visitor Co", primary: "#13294b", accent: "#8fd3fe", lang: "ar" });
    assert.equal(copy.isDemo, true);
    assert.equal(copy.primaryColor, "#13294b");
    const admin = await demoPersona(copy.id, "admin");
    const client = await demoPersona(copy.id, "client");
    assert.ok(admin && client);
    assert.equal(admin.lang, "ar");
    assert.match(admin.email, /\.invalid$/);
    const own = await listProjects({ ...admin, readOnly: false });
    assert.ok(own.length > 0);
    const ids = (await db.select({ id: s.projects.id }).from(s.projects).where(eq(s.projects.orgId, copy.id))).map((r) => r.id);
    assert.ok(own.every((p) => ids.includes(p.id)), "a copy sees only its own projects");
    await deleteDemoCopy(A.org.id); // a real agency: refused silently
    assert.equal((await db.select().from(s.organizations).where(eq(s.organizations.id, A.org.id))).length, 1);
    await deleteDemoCopy(copy.id);
    assert.equal((await db.select().from(s.organizations).where(eq(s.organizations.id, copy.id))).length, 0);
    assert.equal((await db.select().from(s.accounts).where(eq(s.accounts.email, admin.email))).length, 0);
  });
});
