/**
 * Tenant-isolation check. Takes an admin from two different tenants and asserts that every
 * scoped query / accessor used by pages, actions and API routes refuses the other tenant's data.
 *
 *   npm run verify:isolation
 *
 * Needs at least two tenants with data (e.g. `npm run db:seed-preview` plus one signed-up agency).
 * Exits non-zero on the first leak.
 */
import "dotenv/config";
import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "../src/db";
import * as s from "../src/db/schema";
import type { SessionUser } from "../src/lib/auth";
import { getAccessibleProject, getAccessibleTask, projectScope, taskScope } from "../src/lib/access";
import { listActivity, listProjects, listTasks, searchClients, teamWorkload, projectMatrix } from "../src/server/queries";

let failures = 0;
const check = (name: string, ok: boolean) => {
  console.log(`${ok ? "✓" : "✗"} ${name}`);
  if (!ok) failures++;
};
const refuses = async (fn: () => Promise<unknown>) => {
  try {
    await fn();
    return false;
  } catch {
    return true; // notFound() throws
  }
};

async function adminOf(orgId: string): Promise<SessionUser> {
  const u = await db.query.users.findFirst({ where: and(eq(s.users.orgId, orgId), eq(s.users.role, "admin")) });
  if (!u) throw new Error(`No admin in ${orgId}`);
  const { passwordHash: _, ...rest } = u;
  void _;
  return { ...rest, readOnly: false };
}

async function main() {
  const counts = await db.select({ orgId: s.projects.orgId, n: sql<number>`count(*)::int` }).from(s.projects).groupBy(s.projects.orgId);
  const orgs = (await db.select({ id: s.organizations.id, serial: s.organizations.serial }).from(s.organizations)).map((o) => ({
    ...o,
    n: counts.find((c) => c.orgId === o.id)?.n ?? 0,
  }));
  const withData = orgs.filter((o) => o.n > 0);
  if (withData.length < 1 || orgs.length < 2) throw new Error("Need two tenants, one with projects.");
  const B = withData[0]; // the tenant whose data must stay invisible
  const A = orgs.find((o) => o.id !== B.id && o.n > 0) ?? orgs.find((o) => o.id !== B.id)!;
  console.log(`Tenant A ${A.serial} must not see tenant B ${B.serial}\n`);
  const a = await adminOf(A.id);

  const bProject = await db.query.projects.findFirst({ where: eq(s.projects.orgId, B.id) });
  const bTask = await db.query.tasks.findFirst({ where: eq(s.tasks.orgId, B.id) });
  const bClient = await db.query.clients.findFirst({ where: eq(s.clients.orgId, B.id) });

  // Positive controls: the same accessors do return the caller's own rows (so a refusal below means something).
  const aProject = await db.query.projects.findFirst({ where: eq(s.projects.orgId, A.id) });
  const aTask = await db.query.tasks.findFirst({ where: eq(s.tasks.orgId, A.id) });
  if (aProject) check("control: getAccessibleProject returns an own project", !(await refuses(() => getAccessibleProject(a, aProject.id))));
  if (aTask) check("control: getAccessibleTask returns an own task", !(await refuses(() => getAccessibleTask(a, aTask.id))));

  check("listProjects returns no foreign projects", (await listProjects(a)).every((p) => p.id !== bProject!.id));
  check("listTasks returns no foreign tasks", (await listTasks(a)).every((t) => t.id !== bTask!.id));
  check("getAccessibleProject refuses a foreign project id", await refuses(() => getAccessibleProject(a, bProject!.id)));
  check("getAccessibleTask refuses a foreign task id", await refuses(() => getAccessibleTask(a, bTask!.id)));
  check("searchClients never matches a foreign client", (await searchClients(a, bClient!.name.split(" ")[0])).every((c) => c.id !== bClient!.id));
  check("listActivity is tenant-scoped", (await listActivity(a, { limit: 500 })).every((r) => r.projectId === null || r.projectId !== bProject!.id));
  check("teamWorkload lists only own people", (await teamWorkload(a)).every((u) => u.id !== bTask!.assigneeId));
  check("projectMatrix is tenant-scoped", (await projectMatrix(a)).every((p) => p.id !== bProject!.id));

  // Raw scope helpers: zero foreign rows even across the whole table.
  const [leakP] = await db.select({ n: sql<number>`count(*)::int` }).from(s.projects).where(and(projectScope(a), ne(s.projects.orgId, A.id)));
  check("projectScope matches zero rows of other tenants", leakP.n === 0);
  const [leakT] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(s.tasks)
    .innerJoin(s.projects, eq(s.projects.id, s.tasks.projectId))
    .where(and(taskScope(a), ne(s.tasks.orgId, A.id)));
  check("taskScope matches zero rows of other tenants", leakT.n === 0);

  // Structural: every tenant-owned table carries org_id, and rows agree with their parent's tenant.
  const [mismatch] = await db.execute<{ n: number }>(sql`
    select (
      (select count(*) from tasks t join projects p on p.id = t.project_id where t.org_id <> p.org_id) +
      (select count(*) from projects p join clients c on c.id = p.client_id where p.org_id <> c.org_id) +
      (select count(*) from project_modules m join projects p on p.id = m.project_id where m.org_id <> p.org_id) +
      (select count(*) from task_comments tc join tasks t on t.id = tc.task_id where tc.org_id <> t.org_id) +
      (select count(*) from attachments at join tasks t on t.id = at.task_id where at.org_id <> t.org_id) +
      (select count(*) from chat_messages cm join projects p on p.id = cm.project_id where cm.org_id <> p.org_id)
    )::int as n`) as unknown as { n: number }[];
  check("child rows always share their parent's tenant", mismatch.n === 0);

  console.log(failures ? `\n${failures} isolation check(s) FAILED` : "\nAll isolation checks passed.");
  process.exit(failures ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
