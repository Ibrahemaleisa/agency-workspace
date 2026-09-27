import type { ProjectStatus, TaskStatus } from "@/db/schema";
import { APP_DICT } from "./i18n-app";
import type { Localized } from "./events";

/**
 * Notification titles in English and Arabic. The Arabic is gender-neutral: it names the action
 * (passive voice or a noun) and attributes it — "· بواسطة {name}" for actions, "من {name}" for
 * messages — so it reads naturally whoever the person is.
 */
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
    ar: `مشروع جديد ${qa(project)} للعميل ${client} · بواسطة ${actor}`,
  }),
  projectStatus: (actor: string, project: string, status: ProjectStatus): Localized => ({
    en: `${actor} changed ${q(project)} to ${APP_DICT.en.projectStatus[status]}`,
    ar: `تغيّرت حالة ${qa(project)} إلى ${APP_DICT.ar.projectStatus[status]} · بواسطة ${actor}`,
  }),
  assigned: (actor: string, task: string): Localized => ({
    en: `${actor} assigned you ${q(task)}`,
    ar: `أُسندت إليك مهمة ${qa(task)} · بواسطة ${actor}`,
  }),
  taskStatus: (actor: string, task: string, status: TaskStatus, project: string): Localized => ({
    en: `${actor} moved ${q(task)} to ${APP_DICT.en.taskStatus[status]} · ${project}`,
    ar: `انتقلت مهمة ${qa(task)} إلى ${APP_DICT.ar.taskStatus[status]} · ${project} · بواسطة ${actor}`,
  }),
  approvalRequested: (task: string): Localized => ({
    en: `Approval requested: ${q(task)}`,
    ar: `مطلوب موافقتك: ${qa(task)}`,
  }),
  approvalDecided: (actor: string, approved: boolean, task: string): Localized => ({
    en: `${actor} ${approved ? "approved" : "requested changes on"} ${q(task)}`,
    ar: approved ? `تم اعتماد ${qa(task)} · بواسطة ${actor}` : `طلب تعديل على ${qa(task)} من ${actor}`,
  }),
  mentionTask: (actor: string, task: string): Localized => ({
    en: `${actor} mentioned you on ${q(task)}`,
    ar: `تمت الإشارة إليك في مهمة ${qa(task)} · بواسطة ${actor}`,
  }),
  commentTask: (actor: string, task: string): Localized => ({
    en: `${actor} commented on ${q(task)}`,
    ar: `تعليق جديد على مهمة ${qa(task)} من ${actor}`,
  }),
  replyTask: (actor: string, task: string): Localized => ({
    en: `${actor} replied on ${q(task)}`,
    ar: `ردّ جديد على مهمة ${qa(task)} من ${actor}`,
  }),
  mentionChat: (actor: string, project: string): Localized => ({
    en: `${actor} mentioned you in ${project} chat`,
    ar: `تمت الإشارة إليك في محادثة ${project} · بواسطة ${actor}`,
  }),
  chatInternal: (actor: string, project: string): Localized => ({
    en: `${actor} posted in the team chat of ${project}`,
    ar: `رسالة جديدة في محادثة الفريق لمشروع ${project} من ${actor}`,
  }),
  chatClient: (actor: string, project: string): Localized => ({
    en: `${actor} sent a message in ${project}`,
    ar: `رسالة جديدة في ${project} من ${actor}`,
  }),
  teamChatMention: (actor: string): Localized => ({
    en: `${actor} mentioned you in the team chat`,
    ar: `تمت الإشارة إليك في الشات العام · بواسطة ${actor}`,
  }),
  teamChatAll: (actor: string): Localized => ({
    en: `${actor} posted to everyone in the team chat`,
    ar: `رسالة للجميع في الشات العام من ${actor}`,
  }),
};
