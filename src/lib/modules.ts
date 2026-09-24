import { eq, max } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "@/db/schema";
import { projectModules, tasks, type ModuleTemplate, type TaskStatus } from "@/db/schema";

type DB = PostgresJsDatabase<typeof schema>;

/**
 * Attach a module template to a project: snapshot its workflow and fields,
 * and create one starter task per workflow stage so work can begin immediately.
 * Stages flagged `clientApproval` become client-visible approval tasks.
 */
export async function addModuleToProject(
  db: DB,
  opts: {
    orgId: string;
    projectId: string;
    template: ModuleTemplate;
    createdById: string | null;
    fieldValues?: Record<string, string>;
  },
) {
  const { template } = opts;
  const [{ pos }] = await db
    .select({ pos: max(projectModules.position) })
    .from(projectModules)
    .where(eq(projectModules.projectId, opts.projectId));

  const [mod] = await db
    .insert(projectModules)
    .values({
      orgId: opts.orgId,
      projectId: opts.projectId,
      templateId: template.id,
      name: template.name,
      color: template.color,
      stages: template.stages,
      fields: template.fields,
      fieldValues: opts.fieldValues ?? {},
      position: (pos ?? -1) + 1,
    })
    .returning();

  const created = await db
    .insert(tasks)
    .values(
      template.stages.map((stage) => ({
        orgId: opts.orgId,
        projectId: opts.projectId,
        moduleId: mod.id,
        stage: stage.name,
        title: `${template.name}: ${stage.name}`,
        status: "todo" as TaskStatus,
        clientVisible: !!stage.clientApproval,
        requiresApproval: !!stage.clientApproval,
        createdById: opts.createdById,
      })),
    )
    .returning({ id: tasks.id });

  return { module: mod, taskIds: created.map((t) => t.id) };
}

/** Summaries used by project pages: progress and current stage for a module. */
export function summarizeModule(
  mod: { stages: schema.WorkflowStage[] },
  moduleTasks: { stage: string | null; status: TaskStatus }[],
) {
  const total = moduleTasks.length;
  const done = moduleTasks.filter((t) => t.status === "completed").length;
  const stageState = mod.stages.map((s) => {
    const inStage = moduleTasks.filter((t) => t.stage === s.name);
    const complete = inStage.length > 0 && inStage.every((t) => t.status === "completed");
    const started = inStage.some((t) => t.status !== "todo");
    return { ...s, complete, started, count: inStage.length };
  });
  const current = stageState.find((s) => !s.complete);
  return {
    total,
    done,
    progress: total ? Math.round((done / total) * 100) : 0,
    stages: stageState,
    currentStage: current?.name ?? "Done",
  };
}
