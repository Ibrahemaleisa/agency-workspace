/**
 * In-app copy for data lifecycle (delete, edit, export), work tracking (checklists, time,
 * recurring tasks, reports, calendar feed) and paging, in English and Arabic.
 * Merged into the app dictionary by getT() (lib/lang.ts), so pages read it as t.<section>.
 */
import type { Lang } from "./i18n";

const en = {
  lifecycle: {
    dangerZone: "Danger zone",
    typeToConfirm: (word: string) => `Type “${word}” to confirm.`,
    password: "Your password",
    deleteProject: "Delete project",
    deleteProjectBody: "Deletes the project with all its tasks, files, chat and history. This can’t be undone.",
    deleteClient: "Delete client",
    deleteClientBody:
      "Deletes the client, all of their projects (with tasks, files and chat) and their portal accounts. This can’t be undone.",
    deleteTemplate: "Delete template",
    deleteTemplateConfirm: (name: string) => `Delete the “${name}” template? Projects that already use it keep their module.`,
    removeMember: "Remove from workspace",
    removeMemberConfirm: (name: string) =>
      `Remove ${name} from this workspace? Their tasks become unassigned; their comments stay. This can’t be undone.`,
    deleteLead: "Delete",
    deleteLeadConfirm: "Delete this request?",
    editComment: "Edit",
    deleteComment: "Delete",
    deleteCommentConfirm: "Delete this comment?",
    deleteMessageConfirm: "Delete this message?",
    edited: "edited",
    cancel: "Cancel",
    save: "Save",
    exportTitle: "Export your data",
    exportBody:
      "Download everything in this workspace — clients, projects, tasks, comments, chat, time, files list and activity — as one JSON file.",
    exportCta: "Download export",
    deleteWorkspace: "Delete this workspace",
    deleteWorkspaceBody:
      "Deletes the workspace and everything in it for everyone, and stops any subscription. Paid invoices are kept as financial records. This can’t be undone — download an export first.",
    deleteAccount: "Delete my account",
    deleteAccountBody:
      "Removes you from every workspace and deletes your sign-in. Your comments stay without your name. If you are the only admin of a workspace, make someone else admin or delete that workspace first.",
    errors: {
      confirm: "The confirmation text doesn’t match.",
      password: "Your password isn’t correct.",
      self: "You can’t remove yourself. Ask another admin, or delete your account from Settings.",
      soleAdmin: (names: string) => `You are the only admin of: ${names}. Make someone else admin there, or delete it first.`,
      notFound: "Not found.",
      demo: "This is a shared demo, so people and workspaces can’t be removed here.",
      provider: "We couldn’t stop the subscription with the payment provider. Try again, or contact support.",
      empty: "Write something first.",
    },
  },
  paging: {
    newer: "Newer",
    older: "Older",
    prev: "Previous",
    next: "Next",
    page: (n: number, of: number) => `Page ${n} of ${of}`,
    loadOlder: "Show older messages",
  },
};

export type MoreDict = typeof en;

const ar: MoreDict = {
  lifecycle: {
    dangerZone: "منطقة الخطر",
    typeToConfirm: (word: string) => `اكتب «${word}» للتأكيد.`,
    password: "كلمة المرور",
    deleteProject: "حذف المشروع",
    deleteProjectBody: "يحذف المشروع مع كل مهامه وملفاته ومحادثاته وسجله. لا يمكن التراجع عن ذلك.",
    deleteClient: "حذف العميل",
    deleteClientBody: "يحذف العميل وكل مشاريعه (مع المهام والملفات والمحادثات) وحسابات بوابته. لا يمكن التراجع عن ذلك.",
    deleteTemplate: "حذف القالب",
    deleteTemplateConfirm: (name: string) => `حذف قالب «${name}»؟ المشاريع التي تستخدمه تحتفظ بوحدتها.`,
    removeMember: "إزالة من مساحة العمل",
    removeMemberConfirm: (name: string) =>
      `إزالة ${name} من مساحة العمل؟ تصبح مهامه بلا مسؤول وتبقى تعليقاته. لا يمكن التراجع عن ذلك.`,
    deleteLead: "حذف",
    deleteLeadConfirm: "حذف هذا الطلب؟",
    editComment: "تعديل",
    deleteComment: "حذف",
    deleteCommentConfirm: "حذف هذا التعليق؟",
    deleteMessageConfirm: "حذف هذه الرسالة؟",
    edited: "معدّل",
    cancel: "إلغاء",
    save: "حفظ",
    exportTitle: "تصدير بياناتك",
    exportBody: "نزّل كل ما في مساحة العمل — العملاء والمشاريع والمهام والتعليقات والمحادثات والوقت وقائمة الملفات والنشاط — في ملف JSON واحد.",
    exportCta: "تنزيل التصدير",
    deleteWorkspace: "حذف مساحة العمل",
    deleteWorkspaceBody:
      "يحذف مساحة العمل وكل ما فيها للجميع ويوقف أي اشتراك. تبقى الفواتير المدفوعة كسجلات مالية. لا يمكن التراجع — نزّل نسخة تصدير أولاً.",
    deleteAccount: "حذف حسابي",
    deleteAccountBody:
      "يزيلك من كل مساحات العمل ويحذف بيانات دخولك. تبقى تعليقاتك دون اسمك. إن كنت المدير الوحيد لمساحة عمل فعيّن مديراً آخر أو احذفها أولاً.",
    errors: {
      confirm: "نص التأكيد غير مطابق.",
      password: "كلمة المرور غير صحيحة.",
      self: "لا يمكنك إزالة نفسك. اطلب ذلك من مدير آخر، أو احذف حسابك من الإعدادات.",
      soleAdmin: (names: string) => `أنت المدير الوحيد لـ: ${names}. عيّن مديراً آخر هناك أو احذفها أولاً.`,
      notFound: "غير موجود.",
      demo: "هذا عرض تجريبي مشترك، لذا لا يمكن إزالة الأشخاص أو مساحات العمل هنا.",
      provider: "تعذّر إيقاف الاشتراك لدى مزوّد الدفع. حاول مرة أخرى أو تواصل مع الدعم.",
      empty: "اكتب شيئاً أولاً.",
    },
  },
  paging: {
    newer: "الأحدث",
    older: "الأقدم",
    prev: "السابق",
    next: "التالي",
    page: (n: number, of: number) => `صفحة ${n} من ${of}`,
    loadOlder: "عرض الرسائل الأقدم",
  },
};

export const MORE_DICT: Record<Lang, MoreDict> = { en, ar };
