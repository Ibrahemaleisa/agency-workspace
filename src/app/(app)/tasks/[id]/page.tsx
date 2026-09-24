import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { formatDistanceToNow } from "date-fns";
import { ChevronDown, Download, Eye, EyeOff, Hourglass, ImageIcon, Lock, Paperclip, Pencil, Send, Trash2 } from "lucide-react";
import { db } from "@/db";
import { attachments, projectModules, taskComments, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { getAccessibleTask } from "@/lib/access";
import { getT } from "@/lib/lang";
import { can } from "@/lib/permissions";
import { PRIORITIES, TASK_STATUSES } from "@/lib/constants";
import { listActivity, listInternalUsers } from "@/server/queries";
import {
  addComment,
  assignTask,
  decideApproval,
  deleteAttachment,
  deleteTask,
  requestClientApproval,
  toggleAttachmentVisibility,
  updateTask,
  updateTaskStatus,
  uploadAttachment,
} from "@/server/task-actions";
import { ActivityFeed } from "@/components/lists";
import { Highlight } from "@/components/project-chat";
import { ActionForm, AutoSubmitSelect, ConfirmSubmit, SubmitButton } from "@/components/forms";
import {
  Avatar,
  Badge,
  Card,
  Checkbox,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
  Textarea,
  FILE_INPUT,
  cn,
  isImageType,
} from "@/components/ui";
import { ApprovalBadge, DueDate, Person, PriorityBadge, StatusBadge } from "@/components/labels";

export default async function TaskPage({ params }: PageProps<"/tasks/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const { task, project } = await getAccessibleTask(user, id);
  const isClient = user.role === "client";
  const { t: tr, locale } = await getT();
  const k = tr.task;

  const [mod, assignee, comments, files, history, people] = await Promise.all([
    task.moduleId ? db.query.projectModules.findFirst({ where: eq(projectModules.id, task.moduleId) }) : null,
    task.assigneeId ? db.query.users.findFirst({ where: eq(users.id, task.assigneeId) }) : null,
    db
      .select({
        id: taskComments.id,
        body: taskComments.body,
        internal: taskComments.internal,
        createdAt: taskComments.createdAt,
        authorName: users.name,
        authorRole: users.role,
      })
      .from(taskComments)
      .leftJoin(users, eq(users.id, taskComments.authorId))
      .where(and(eq(taskComments.taskId, task.id), isClient ? eq(taskComments.internal, false) : undefined))
      .orderBy(asc(taskComments.createdAt)),
    db
      .select({
        id: attachments.id,
        fileName: attachments.fileName,
        mimeType: attachments.mimeType,
        size: attachments.size,
        clientVisible: attachments.clientVisible,
        createdAt: attachments.createdAt,
        uploaderId: attachments.uploaderId,
        uploaderName: users.name,
      })
      .from(attachments)
      .leftJoin(users, eq(users.id, attachments.uploaderId))
      .where(and(eq(attachments.taskId, task.id), isClient ? eq(attachments.clientVisible, true) : undefined))
      .orderBy(asc(attachments.createdAt)),
    listActivity(user, { taskId: task.id, limit: 50 }),
    can(user, "tasks.assign") ? listInternalUsers(user.orgId) : Promise.resolve([]),
  ]);
  const clientUsers = isClient
    ? 1
    : (
        await db
          .select({ id: users.id })
          .from(users)
          .where(and(eq(users.clientId, project.clientId), eq(users.role, "client"), eq(users.active, true)))
      ).length;

  const canDecide = can(user, "approvals.decide") && task.approvalStatus === "pending";
  const images = files.filter((f) => isImageType(f.mimeType));
  const docs = files.filter((f) => !isImageType(f.mimeType));
  const canManageFile = (f: (typeof files)[number]) => f.uploaderId === user.id || user.role === "admin";
  const fileActions = (f: (typeof files)[number]) => (
    <>
      {can(user, "tasks.setClientVisibility") && (
        <form action={toggleAttachmentVisibility}>
          <input type="hidden" name="attachmentId" value={f.id} />
          <button className="rounded p-1 text-zinc-500 hover:bg-zinc-100" title={f.clientVisible ? k.hideFromClient : k.shareWithClient}>
            {f.clientVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </form>
      )}
      {canManageFile(f) && (
        <form action={deleteAttachment}>
          <input type="hidden" name="attachmentId" value={f.id} />
          <button className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600" title={tr.common.delete}>
            <Trash2 className="size-4" />
          </button>
        </form>
      )}
    </>
  );

  return (
    <>
      <PageHeader
        breadcrumb={[
          { href: "/projects", label: tr.projects.title },
          { href: `/projects/${project.id}`, label: project.name },
        ]}
        title={task.title}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {mod && <Badge tone={mod.color}>{mod.name}</Badge>}
            {task.stage && <span>{task.stage}</span>}
            <StatusBadge status={task.status} />
            <ApprovalBadge status={task.approvalStatus} />
            {!isClient && task.clientVisible && (
              <Badge tone="amber">
                <Eye className="size-3" /> {k.clientCanSee}
              </Badge>
            )}
          </span>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          {canDecide && (
            <div className="rounded-xl border border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 p-4 md:p-5">
              <h2 className="text-sm font-semibold text-amber-900">{k.approvalNeeded}</h2>
              <p className="mt-1 text-sm text-amber-800">
                {k.approvalNeededHint}
              </p>
              <ActionForm action={decideApproval} className="mt-3 space-y-2">
                <input type="hidden" name="taskId" value={task.id} />
                <Textarea name="feedback" rows={2} placeholder={k.feedbackPlaceholder} className="bg-white" />
                <div className="flex gap-2">
                  <SubmitButton name="decision" value="approve" variant="success">
                    {k.approve}
                  </SubmitButton>
                  <SubmitButton name="decision" value="reject" variant="danger">
                    {k.requestChanges}
                  </SubmitButton>
                </div>
              </ActionForm>
            </div>
          )}
          {!isClient && can(user, "tasks.setClientVisibility") && (task.approvalStatus === "pending" ? (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <Hourglass className="mt-0.5 size-4 shrink-0 text-amber-600" />
              <div className="text-sm">
                <div className="font-semibold text-amber-900">{k.approvalPendingTitle}</div>
                <p className="mt-0.5 text-amber-800">{k.approvalPendingHint}</p>
                {clientUsers === 0 && <NoClientUsers k={k} isAdmin={user.role === "admin"} />}
              </div>
            </div>
          ) : task.status !== "completed" && (
            <div className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)] md:p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Send className="size-4 text-zinc-500 rtl:-scale-x-100" /> {k.approvalBoxTitle}
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                {task.approvalStatus === "rejected" ? k.approvalRejectedHint : k.approvalBoxHint}
              </p>
              {clientUsers === 0 && <NoClientUsers k={k} isAdmin={user.role === "admin"} />}
              <ActionForm action={requestClientApproval} resetOnSuccess successMessage={k.approvalSent} className="mt-3 space-y-2">
                <input type="hidden" name="taskId" value={task.id} />
                <Textarea name="note" rows={2} placeholder={k.approvalNotePlaceholder} />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-zinc-400">{docs.length + images.length > 0 ? k.shareFilesHint : ""}</span>
                  <SubmitButton size="sm" data-testid="request-approval">
                    {task.approvalStatus === "rejected" ? k.requestAgain : k.requestApproval}
                  </SubmitButton>
                </div>
              </ActionForm>
            </div>
          ))}

          <Card title={k.description}>
            {task.description ? (
              <p dir="auto" className="text-sm whitespace-pre-wrap text-zinc-700">{task.description}</p>
            ) : (
              <p className="text-sm text-zinc-400">{k.noDescription}</p>
            )}
          </Card>

          <Card
            title={
              <span className="flex items-center gap-1.5">
                <Paperclip className="size-4" /> {isClient ? k.deliverables : k.files}
              </span>
            }
            padded={false}
          >
            {files.length === 0 && <EmptyState>{k.noFiles}</EmptyState>}
            {images.length > 0 && (
              <div className="border-b border-zinc-100 p-4">
                <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                  <ImageIcon className="size-3.5" /> {tr.media.images} ({images.length})
                </div>
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {images.map((f) => (
                    <li key={f.id} className="group overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
                      <a href={`/api/files/${f.id}?inline`} target="_blank" rel="noopener" className="block aspect-[4/3] overflow-hidden bg-zinc-100">
                        {/* eslint-disable-next-line @next/next/no-img-element -- private, access-checked file route */}
                        <img
                          src={`/api/files/${f.id}?inline`}
                          alt={f.fileName}
                          loading="lazy"
                          className="size-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      </a>
                      <div className="flex items-center gap-1 px-2 py-1.5">
                        <span className="min-w-0 flex-1 truncate text-xs text-zinc-600" title={f.fileName}>
                          {f.fileName}
                        </span>
                        {!isClient && f.clientVisible && <Eye className="size-3.5 text-amber-600" aria-label={k.sharedWithClient} />}
                        {fileActions(f)}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {docs.length > 0 && (
              <ul className="divide-y divide-zinc-100">
                {docs.map((f) => (
                  <li key={f.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="min-w-0 flex-1">
                      <a href={`/api/files/${f.id}`} className="block truncate text-sm font-medium hover:text-indigo-600">
                        {f.fileName}
                      </a>
                      <div className="text-xs text-zinc-400">
                        {formatBytes(f.size)} · {f.uploaderName} · {formatDistanceToNow(f.createdAt, { addSuffix: true, locale })}
                      </div>
                    </div>
                    {!isClient && (f.clientVisible ? <Badge tone="amber">{k.sharedWithClient}</Badge> : <Badge>{k.internal}</Badge>)}
                    <a href={`/api/files/${f.id}`} className="rounded p-1 text-zinc-500 hover:bg-zinc-100" title={k.download}>
                      <Download className="size-4" />
                    </a>
                    {fileActions(f)}
                  </li>
                ))}
              </ul>
            )}
            {can(user, "files.upload") && (
              <ActionForm action={uploadAttachment} resetOnSuccess className="flex flex-wrap items-center gap-3 border-t border-zinc-100 px-4 py-3">
                <input type="hidden" name="taskId" value={task.id} />
                <input type="file" name="files" multiple required aria-label={tr.media.addFiles} className={cn(FILE_INPUT, "w-auto flex-1")} />
                {can(user, "tasks.setClientVisibility") && <Checkbox name="clientVisible" label={k.shareWithClient} />}
                <SubmitButton size="sm" variant="secondary" pendingText={k.uploading}>
                  {tr.media.upload}
                </SubmitButton>
              </ActionForm>
            )}
          </Card>

          <Card title={k.comments(comments.length)} padded={false}>
            {comments.length === 0 ? (
              <EmptyState>{k.noComments}</EmptyState>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {comments.map((c) => (
                  <li key={c.id} className={cn("flex gap-3 px-4 py-3", c.internal && "bg-amber-50/40")}>
                    <Avatar name={c.authorName} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-sm font-medium">{c.authorName ?? tr.common.deletedUser}</span>
                        {c.authorRole === "client" && <Badge tone="amber">{tr.chat.clientBadge}</Badge>}
                        {!isClient &&
                          (c.internal ? (
                            <span className="flex items-center gap-1 text-xs text-zinc-500">
                              <Lock className="size-3" /> {k.internal}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-amber-700">
                              <Eye className="size-3" /> {k.clientVisible}
                            </span>
                          ))}
                        <span className="text-xs text-zinc-400">{formatDistanceToNow(c.createdAt, { addSuffix: true, locale })}</span>
                      </div>
                      <p dir="auto" className="mt-1 text-sm whitespace-pre-wrap text-zinc-700">
                        <Highlight text={c.body} />
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <ActionForm action={addComment} resetOnSuccess className="space-y-2 border-t border-zinc-100 p-4">
              <input type="hidden" name="taskId" value={task.id} />
              <Textarea name="body" rows={3} required placeholder={k.commentPlaceholder} />
              <div className="flex flex-wrap items-center justify-between gap-2">
                {!isClient ? (
                  task.clientVisible ? (
                    <Select
                      name="visibility"
                      defaultValue="internal"
                      className="w-auto"
                      options={[
                        { value: "internal", label: k.internalNote },
                        { value: "client", label: k.replyToClient },
                      ]}
                    />
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-zinc-500">
                      <Lock className="size-3" /> {k.internalOnly}
                    </span>
                  )
                ) : (
                  <span />
                )}
                <SubmitButton size="sm">{k.comment}</SubmitButton>
              </div>
            </ActionForm>
          </Card>

          <Card title={k.history} padded={false}>
            <ActivityFeed items={history} showProject={false} empty={k.noHistory} />
          </Card>
        </div>

        {/* Sidebar: shown first on phones so status/assignee are one tap away */}
        <div className="order-first min-w-0 space-y-6 lg:order-none">
          <Card>
            <dl className="space-y-4 text-sm">
              <SideField label={tr.common.status}>
                {can(user, "tasks.updateStatus") ? (
                  <form action={updateTaskStatus}>
                    <input type="hidden" name="taskId" value={task.id} />
                    <AutoSubmitSelect
                      name="status"
                      defaultValue={task.status}
                      options={TASK_STATUSES.map((x) => ({ value: x.value, label: tr.taskStatus[x.value] }))}
                    />
                  </form>
                ) : (
                  <StatusBadge status={task.status} />
                )}
              </SideField>
              <SideField label={tr.common.assignee}>
                {can(user, "tasks.assign") ? (
                  <form action={assignTask}>
                    <input type="hidden" name="taskId" value={task.id} />
                    <AutoSubmitSelect
                      name="assigneeId"
                      defaultValue={task.assigneeId ?? ""}
                      options={[{ value: "", label: tr.common.unassigned }, ...people.map((p) => ({ value: p.id, label: p.name }))]}
                    />
                  </form>
                ) : (
                  <Person name={assignee?.name} />
                )}
              </SideField>
              <SideField label={tr.common.priority}>
                <PriorityBadge priority={task.priority} />
              </SideField>
              <SideField label={tr.taskForm.dueDate}>
                <DueDate date={task.dueDate} status={task.status} />
              </SideField>
              <SideField label={tr.common.project}>
                <Link href={`/projects/${project.id}`} className="text-indigo-600 hover:underline">
                  {project.name}
                </Link>
              </SideField>
            </dl>
          </Card>

          {can(user, "tasks.edit") && (
            <details className="group rounded-xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5 text-sm font-semibold select-none md:px-5">
                <span className="flex items-center gap-2">
                  <Pencil className="size-4 text-zinc-400" /> {k.editDetails}
                </span>
                <ChevronDown className="size-4 text-zinc-400 transition group-open:rotate-180" />
              </summary>
              <ActionForm action={updateTask} className="space-y-3 border-t border-zinc-100 p-4 md:p-5" successMessage={k.taskUpdated}>
                <input type="hidden" name="taskId" value={task.id} />
                <Field label={tr.taskForm.title}>
                  <Input name="title" defaultValue={task.title} required />
                </Field>
                <Field label={tr.taskForm.description}>
                  <Textarea name="description" rows={4} defaultValue={task.description ?? ""} />
                </Field>
                {mod && (
                  <Field label={k.stage(mod.name)}>
                    <Select
                      name="stage"
                      defaultValue={task.stage ?? ""}
                      placeholder="—"
                      options={mod.stages.map((s) => ({ value: s.name, label: s.name }))}
                    />
                  </Field>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <Field label={tr.common.priority}>
                    <Select
                      name="priority"
                      defaultValue={task.priority}
                      options={PRIORITIES.map((x) => ({ value: x.value, label: tr.priority[x.value] }))}
                    />
                  </Field>
                  <Field label={tr.taskForm.dueDate}>
                    <Input type="date" name="dueDate" defaultValue={task.dueDate ?? ""} />
                  </Field>
                </div>
                {can(user, "tasks.setClientVisibility") && (
                  <div className="space-y-2">
                    <Checkbox name="clientVisible" defaultChecked={task.clientVisible} label={tr.taskForm.visibleToClient} />
                    <Checkbox name="requiresApproval" defaultChecked={task.requiresApproval} label={tr.taskForm.requiresApproval} />
                  </div>
                )}
                <div className="flex justify-end">
                  <SubmitButton size="sm">{tr.common.save}</SubmitButton>
                </div>
              </ActionForm>
            </details>
          )}

          {can(user, "tasks.delete") && (
            <form action={deleteTask} className="text-end">
              <input type="hidden" name="taskId" value={task.id} />
              <ConfirmSubmit message={k.deleteConfirm}>{k.deleteTask}</ConfirmSubmit>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

function SideField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="mb-1 text-xs font-medium text-zinc-500">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function NoClientUsers({ k, isAdmin }: { k: { noClientUsers: string; addClientUser: string }; isAdmin: boolean }) {
  return (
    <p className="mt-2 text-xs font-medium text-red-600">
      {k.noClientUsers}{" "}
      {isAdmin && (
        <Link href="/team" className="underline">
          {k.addClientUser}
        </Link>
      )}
    </p>
  );
}
