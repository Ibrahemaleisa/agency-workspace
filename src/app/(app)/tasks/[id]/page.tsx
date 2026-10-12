import Link from "next/link";
import { and, asc, desc, eq } from "drizzle-orm";
import { formatDistanceToNow } from "date-fns";
import { Check, ChevronDown, Download, Eye, EyeOff, Hourglass, ImageIcon, ListChecks, Lock, Paperclip, Pencil, Repeat, Send, Timer, Trash2, X } from "lucide-react";
import { db } from "@/db";
import { attachments, checklistItems, projectModules, taskComments, timeEntries, users } from "@/db/schema";
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
  registerDirectUploads,
  updateTaskStatus,
  uploadAttachment,
} from "@/server/task-actions";
import { DirectUpload } from "@/components/direct-upload";
import { MAX_DIRECT_UPLOAD_BYTES, directUploadsEnabled } from "@/lib/uploads";
import { deleteComment, editComment } from "@/server/lifecycle-actions";
import { addChecklistItem, deleteTimeEntry, logTime, removeChecklistItem, toggleChecklistItem } from "@/server/work-actions";
import { formatMinutes } from "@/lib/time";
import { todayISO } from "@/server/queries";
import { ActivityFeed } from "@/components/lists";
import { Highlight } from "@/components/project-chat";
import { FilePicker } from "@/components/file-picker";
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
  cn,
  formatDate,
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

  const isStaff = !isClient;
  const [steps, time] = isStaff
    ? await Promise.all([
        db.select().from(checklistItems).where(eq(checklistItems.taskId, task.id)).orderBy(asc(checklistItems.position), asc(checklistItems.createdAt)),
        db
          .select({ id: timeEntries.id, minutes: timeEntries.minutes, note: timeEntries.note, spentOn: timeEntries.spentOn, userId: timeEntries.userId, userName: users.name })
          .from(timeEntries)
          .leftJoin(users, eq(users.id, timeEntries.userId))
          .where(eq(timeEntries.taskId, task.id))
          .orderBy(desc(timeEntries.spentOn), desc(timeEntries.createdAt)),
      ])
    : [[], []];
  const totalMinutes = time.reduce((n, e) => n + e.minutes, 0);
  const [mod, assignee, comments, files, history, people] = await Promise.all([
    task.moduleId ? db.query.projectModules.findFirst({ where: eq(projectModules.id, task.moduleId) }) : null,
    task.assigneeId ? db.query.users.findFirst({ where: eq(users.id, task.assigneeId) }) : null,
    db
      .select({
        id: taskComments.id,
        body: taskComments.body,
        internal: taskComments.internal,
        createdAt: taskComments.createdAt,
        editedAt: taskComments.editedAt,
        authorId: taskComments.authorId,
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
          <button className="rounded p-1 text-zinc-500 hover:bg-red-50 hover:text-red-600" title={tr.common.delete}>
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
            {task.recurrence && !isClient && (
              <Badge tone="blue">
                <Repeat className="size-3" /> {tr.recurrence.badge[task.recurrence]}
              </Badge>
            )}
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
                  <span className="text-xs text-zinc-500">{docs.length + images.length > 0 ? k.shareFilesHint : ""}</span>
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
              <p className="text-sm text-zinc-500">{k.noDescription}</p>
            )}
          </Card>

          {isStaff && (
            <Card
              title={
                <span className="flex items-center gap-2">
                  <ListChecks className="size-4" /> {tr.checklist.title}
                  {steps.length > 0 && (
                    <span className="text-xs font-normal text-zinc-500">{tr.checklist.progress(steps.filter((s) => s.done).length, steps.length)}</span>
                  )}
                </span>
              }
              padded={false}
            >
              {steps.length === 0 ? (
                <p className="px-4 py-3 text-sm text-zinc-500">{tr.checklist.empty}</p>
              ) : (
                <ul className="divide-y divide-zinc-100">
                  {steps.map((s) => (
                    <li key={s.id} className="flex items-center gap-3 px-4 py-2">
                      <form action={toggleChecklistItem}>
                        <input type="hidden" name="itemId" value={s.id} />
                        <button
                          disabled={!can(user, "tasks.updateStatus")}
                          aria-pressed={s.done}
                          aria-label={s.title}
                          className={cn(
                            "flex size-5 items-center justify-center rounded border",
                            s.done ? "border-emerald-600 bg-emerald-600 text-white" : "border-zinc-300 bg-white hover:border-zinc-500",
                          )}
                        >
                          {s.done && <Check className="size-3.5" />}
                        </button>
                      </form>
                      <span dir="auto" className={cn("min-w-0 flex-1 text-sm", s.done && "text-zinc-400 line-through")}>
                        {s.title}
                      </span>
                      {can(user, "tasks.edit") && (
                        <form action={removeChecklistItem}>
                          <input type="hidden" name="itemId" value={s.id} />
                          <button className="rounded p-1 text-zinc-400 hover:text-red-600" title={tr.checklist.remove} aria-label={tr.checklist.remove}>
                            <X className="size-3.5" />
                          </button>
                        </form>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {can(user, "tasks.edit") && (
                <ActionForm action={addChecklistItem} resetOnSuccess className="flex gap-2 border-t border-zinc-100 px-4 py-3">
                  <input type="hidden" name="taskId" value={task.id} />
                  <Input name="title" required maxLength={300} placeholder={tr.checklist.placeholder} />
                  <SubmitButton size="sm" variant="secondary">{tr.checklist.add}</SubmitButton>
                </ActionForm>
              )}
            </Card>
          )}

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
                      <div className="text-xs text-zinc-500">
                        <bdi>{formatBytes(f.size)}</bdi> · <bdi>{f.uploaderName}</bdi> · {formatDistanceToNow(f.createdAt, { addSuffix: true, locale })}
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
            {can(user, "files.upload") && directUploadsEnabled() && (
              <DirectUpload
                taskId={task.id}
                orgId={user.orgId}
                canShare={can(user, "tasks.setClientVisibility")}
                maxBytes={MAX_DIRECT_UPLOAD_BYTES}
                register={registerDirectUploads}
                labels={{
                  choose: tr.media.choose,
                  hint: tr.media.dropHint,
                  chosen: tr.media.chosen,
                  upload: tr.media.upload,
                  uploading: k.uploading,
                  share: k.shareWithClient,
                  tooLarge: tr.actions.fileTooLarge(MAX_DIRECT_UPLOAD_BYTES / 1024 / 1024),
                  failed: tr.errors.generic,
                }}
              />
            )}
            {can(user, "files.upload") && !directUploadsEnabled() && (
              <ActionForm action={uploadAttachment} resetOnSuccess className="flex flex-wrap items-center gap-3 border-t border-zinc-100 px-4 py-3">
                <input type="hidden" name="taskId" value={task.id} />
                <FilePicker
                  name="files"
                  multiple
                  required
                  labels={{ choose: tr.media.choose, hint: tr.media.dropHint, chosen: tr.media.chosen }}
                  className="min-w-56 flex-1"
                />
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
                        <span className="text-xs text-zinc-500">
                          {formatDistanceToNow(c.createdAt, { addSuffix: true, locale })}
                          {c.editedAt && <> · {tr.lifecycle.edited}</>}
                        </span>
                        {(c.authorId === user.id || user.role === "admin") && (
                          <form action={deleteComment} className="ms-auto">
                            <input type="hidden" name="commentId" value={c.id} />
                            <ConfirmSubmit message={tr.lifecycle.deleteCommentConfirm} variant="ghost">
                              <Trash2 className="size-3.5" aria-label={tr.lifecycle.deleteComment} />
                            </ConfirmSubmit>
                          </form>
                        )}
                      </div>
                      <p dir="auto" className="mt-1 text-sm whitespace-pre-wrap text-zinc-700">
                        <Highlight text={c.body} />
                      </p>
                      {c.authorId === user.id && (
                        <details className="mt-1">
                          <summary className="cursor-pointer list-none text-xs font-medium text-zinc-500 hover:text-zinc-900">{tr.lifecycle.editComment}</summary>
                          <ActionForm action={editComment} className="mt-2 space-y-2">
                            <input type="hidden" name="commentId" value={c.id} />
                            <Textarea name="body" rows={3} required defaultValue={c.body} />
                            <div className="flex justify-end">
                              <SubmitButton size="sm" variant="secondary">{tr.lifecycle.save}</SubmitButton>
                            </div>
                          </ActionForm>
                        </details>
                      )}
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

          {isStaff && (
            <Card
              title={
                <span className="flex items-center gap-2">
                  <Timer className="size-4" /> {tr.time.title}
                  {totalMinutes > 0 && <span className="text-xs font-normal text-zinc-500">{tr.time.total(formatMinutes(totalMinutes))}</span>}
                </span>
              }
              padded={false}
            >
              {time.length === 0 ? (
                <p className="px-4 py-3 text-sm text-zinc-500">{tr.time.empty}</p>
              ) : (
                <ul className="divide-y divide-zinc-100">
                  {time.map((e) => (
                    <li key={e.id} className="flex items-center gap-3 px-4 py-2 text-sm">
                      <span className="w-14 font-medium tabular-nums" dir="ltr">{formatMinutes(e.minutes)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="text-zinc-700">{e.userName ?? tr.common.deletedUser}</span>
                        <span className="text-zinc-500"> · {formatDate(e.spentOn, "d MMM", locale)}</span>
                        {e.note && <span dir="auto" className="block truncate text-xs text-zinc-500">{e.note}</span>}
                      </span>
                      {(e.userId === user.id || user.role === "admin") && (
                        <form action={deleteTimeEntry}>
                          <input type="hidden" name="entryId" value={e.id} />
                          <button className="rounded p-1 text-zinc-400 hover:text-red-600" title={tr.time.remove} aria-label={tr.time.remove}>
                            <X className="size-3.5" />
                          </button>
                        </form>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {can(user, "time.log") && (
                <ActionForm action={logTime} resetOnSuccess className="grid grid-cols-2 gap-2 border-t border-zinc-100 px-4 py-3 sm:grid-cols-5">
                  <input type="hidden" name="taskId" value={task.id} />
                  <Field label={tr.time.hours}>
                    <Input name="hours" type="number" min={0} max={24} step={1} defaultValue={0} />
                  </Field>
                  <Field label={tr.time.minutes}>
                    <Input name="minutes" type="number" min={0} max={59} step={5} defaultValue={30} />
                  </Field>
                  <Field label={tr.time.date}>
                    <Input name="spentOn" type="date" defaultValue={todayISO()} required />
                  </Field>
                  <Field label={tr.time.note} className="col-span-2 sm:col-span-1">
                    <Input name="note" maxLength={500} />
                  </Field>
                  <div className="col-span-2 flex items-end sm:col-span-1">
                    <SubmitButton size="sm" variant="secondary" className="w-full">{tr.time.log}</SubmitButton>
                  </div>
                </ActionForm>
              )}
            </Card>
          )}

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
                    {task.requiresApproval && task.approvalStatus !== "approved" && task.status !== "completed" && (
                      <p className="mt-1.5 text-xs text-zinc-500">
                        {can(user, "approvals.override") ? k.completeNeedsApprovalAdmin : k.completeNeedsApproval}
                      </p>
                    )}
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
                  <Pencil className="size-4 text-zinc-500" /> {k.editDetails}
                </span>
                <ChevronDown className="size-4 text-zinc-500 transition group-open:rotate-180" />
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
                <Field label={tr.recurrence.label} hint={tr.recurrence.hint}>
                  <Select
                    name="recurrence"
                    defaultValue={task.recurrence ?? ""}
                    options={[
                      { value: "", label: tr.recurrence.none },
                      { value: "daily", label: tr.recurrence.daily },
                      { value: "weekly", label: tr.recurrence.weekly },
                      { value: "monthly", label: tr.recurrence.monthly },
                    ]}
                  />
                </Field>
                {can(user, "tasks.setClientVisibility") && (
                  <div className="space-y-2">
                    <Checkbox name="clientVisible" defaultChecked={task.clientVisible} label={tr.taskForm.visibleToClient} />
                    <Checkbox name="requiresApproval" defaultChecked={task.requiresApproval} disabled={task.requiresApproval && !can(user, "approvals.override")} label={tr.taskForm.requiresApproval} />
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
