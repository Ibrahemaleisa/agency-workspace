import type { ProjectStatus, TaskStatus } from "@/db/schema";
import { APP_DICT } from "./i18n-app";
import type { Localized } from "./events";

/** Notification titles in English and Arabic. */
const q = (s: string) => `"${s}"`;
const qa = (s: string) => `«${s}»`;

export const nt = {
  lead: (name: string, company?: string | null): Localized => ({
    en: `New project request from ${name}${company ? ` (${company})` : ""}`,
    ar: `طلب مشروع جديد من ${name}${company ? ` (${company})` : ""}`,
  }),
  addedToProject: (project: string): Localized => ({
    en: `You were added to project ${q(project)}`,
    ar: `تمت إضافتك إلى مشروع ${qa(project)}`,
  }),
  projectCreated: (actor: string, project: string, client: string): Localized => ({
    en: `${actor} created project ${q(project)} for ${client}`,
    ar: `أنشأ ${actor} مشروع ${qa(project)} للعميل ${client}`,
  }),
  projectStatus: (actor: string, project: string, status: ProjectStatus): Localized => ({
    en: `${actor} changed ${q(project)} to ${APP_DICT.en.projectStatus[status]}`,
    ar: `غيّر ${actor} حالة ${qa(project)} إلى ${APP_DICT.ar.projectStatus[status]}`,
  }),
  assigned: (actor: string, task: string): Localized => ({
    en: `${actor} assigned you ${q(task)}`,
    ar: `أسند إليك ${actor} مهمة ${qa(task)}`,
  }),
  taskStatus: (actor: string, task: string, status: TaskStatus, project: string): Localized => ({
    en: `${actor} moved ${q(task)} to ${APP_DICT.en.taskStatus[status]} · ${project}`,
    ar: `نقل ${actor} مهمة ${qa(task)} إلى ${APP_DICT.ar.taskStatus[status]} · ${project}`,
  }),
  approvalRequested: (task: string): Localized => ({
    en: `Approval requested: ${q(task)}`,
    ar: `مطلوب موافقتك: ${qa(task)}`,
  }),
  approvalDecided: (actor: string, approved: boolean, task: string): Localized => ({
    en: `${actor} ${approved ? "approved" : "requested changes on"} ${q(task)}`,
    ar: approved ? `وافق ${actor} على ${qa(task)}` : `طلب ${actor} تعديلات على ${qa(task)}`,
  }),
  mentionTask: (actor: string, task: string): Localized => ({
    en: `${actor} mentioned you on ${q(task)}`,
    ar: `أشار إليك ${actor} في مهمة ${qa(task)}`,
  }),
  commentTask: (actor: string, task: string): Localized => ({
    en: `${actor} commented on ${q(task)}`,
    ar: `علّق ${actor} على مهمة ${qa(task)}`,
  }),
  replyTask: (actor: string, task: string): Localized => ({
    en: `${actor} replied on ${q(task)}`,
    ar: `ردّ ${actor} على مهمة ${qa(task)}`,
  }),
  mentionChat: (actor: string, project: string): Localized => ({
    en: `${actor} mentioned you in ${project} chat`,
    ar: `أشار إليك ${actor} في محادثة ${project}`,
  }),
  chatInternal: (actor: string, project: string): Localized => ({
    en: `${actor} posted in the team chat of ${project}`,
    ar: `كتب ${actor} في محادثة الفريق لمشروع ${project}`,
  }),
  chatClient: (actor: string, project: string): Localized => ({
    en: `${actor} sent a message in ${project}`,
    ar: `أرسل ${actor} رسالة في ${project}`,
  }),
  teamChatMention: (actor: string): Localized => ({
    en: `${actor} mentioned you in the team chat`,
    ar: `أشار إليك ${actor} في الشات العام`,
  }),
  teamChatAll: (actor: string): Localized => ({
    en: `${actor} posted to everyone in the team chat`,
    ar: `كتب ${actor} للجميع في الشات العام`,
  }),
};
