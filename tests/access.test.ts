/**
 * Access-control tests: who can see which projects and tasks.
 * Run against a database loaded with the demo data:  npm run demo && npm test
 */
import "dotenv/config";
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { projects, tasks, users } from "@/db/schema";
import type { SessionUser } from "@/lib/auth";
import { listProjects, listTasks } from "@/server/queries";

async function userByEmail(email: string): Promise<SessionUser> {
  const u = await db.query.users.findFirst({ where: eq(users.email, email) });
  assert.ok(u, `demo user ${email} missing — run "npm run demo" first`);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...user } = u;
  return user;
}

let admin: SessionUser;
let client: SessionUser;

before(async () => {
  admin = await userByEmail("sara@northwind.agency");
  client = await userByEmail("lina@bloomcafe.com");
});

after(async () => {
  await db.$client.end();
});

describe("employees", () => {
  test("see tasks assigned to them even in projects they are not a member of", async () => {
    const rows = await db.execute<{ user_id: string; task_id: string }>(sql`
      select t.assignee_id as user_id, t.id as task_id
      from tasks t join users u on u.id = t.assignee_id join projects p on p.id = t.project_id
      where u.role = 'employee' and p.owner_id is distinct from u.id
        and not exists (select 1 from project_members m where m.project_id = p.id and m.user_id = u.id)
      limit 1`);
    assert.ok(rows.length, "demo data should contain an assignment outside the assignee's projects");
    const [{ user_id, task_id }] = rows;
    const employee = (await db.query.users.findFirst({ where: eq(users.id, user_id) }))!;
    const mine = await listTasks(employee, { assigneeId: employee.id });
    assert.ok(mine.some((t) => t.id === task_id));
  });

  test("do not see projects they have no part in", async () => {
    const rows = await db.execute<{ user_id: string; project_id: string }>(sql`
      select u.id as user_id, p.id as project_id from users u cross join projects p
      where u.role = 'employee' and p.owner_id is distinct from u.id
        and not exists (select 1 from project_members m where m.project_id = p.id and m.user_id = u.id)
        and not exists (select 1 from tasks t where t.project_id = p.id and t.assignee_id = u.id)
      limit 1`);
    assert.ok(rows.length);
    const [{ user_id, project_id }] = rows;
    const employee = (await db.query.users.findFirst({ where: eq(users.id, user_id) }))!;
    assert.ok(!(await listProjects(employee)).some((p) => p.id === project_id));
    assert.ok(!(await listTasks(employee, { projectId: project_id })).length);
  });
});

describe("clients", () => {
  test("only see their own company's projects", async () => {
    const visible = await listProjects(client);
    assert.ok(visible.length > 0);
    assert.ok(visible.every((p) => p.clientId === client.clientId));
  });

  test("only see tasks shared with them", async () => {
    const visible = await listTasks(client);
    assert.ok(visible.length > 0);
    assert.ok(visible.every((t) => t.clientVisible));
  });

  test("project counts only include shared tasks", async () => {
    for (const p of await listProjects(client)) {
      const [{ n }] = await db
        .select({ n: sql<number>`count(*)::int` })
        .from(tasks)
        .where(and(eq(tasks.projectId, p.id), eq(tasks.clientVisible, true)));
      assert.equal(p.total, n, `${p.name}: client sees ${p.total} tasks, ${n} are shared`);
    }
  });
});

describe("admins", () => {
  test("see every project in the agency", async () => {
    const [{ n }] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(projects)
      .where(eq(projects.orgId, admin.orgId));
    assert.equal((await listProjects(admin)).length, n);
  });
});
