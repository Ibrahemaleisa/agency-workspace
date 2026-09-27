import type { AppDict } from "./i18n-app";
import type { Lang } from "./i18n";

type P = Record<string, string>;
type Tpl = (p: P, t: AppDict) => string;

const q = (lang: Lang, s: string) => (lang === "ar" ? `«${s}»` : `"${s}"`);

/*
 * Activity entries in the reader's language. English reads after the person's name ("Sara moved …");
 * Arabic uses a neutral noun phrase shown before the name ("نقل … · سارة"), so it never has to guess
 * anyone's gender. Entries recorded before params existed keep their stored English summary.
 */
const EN: Record<string, Tpl> = {
  "task.created": (p) => `created task ${q("en", p.title)}`,
  "task.updated": (p) => `edited ${q("en", p.title)}`,
  "task.assigned": (p) => (p.name ? `assigned ${q("en", p.title)} to ${p.name}` : `unassigned ${q("en", p.title)}`),
  "task.deleted": (p) => `deleted task ${q("en", p.title)}`,
  "task.status": (p, t) => `moved ${q("en", p.title)} from ${status(t, p.from)} to ${status(t, p.to)}`,
  "approval.requested": (p) => `requested client approval on ${q("en", p.title)}`,
  "approval.approved": (p) => `approved ${q("en", p.title)}`,
  "approval.rejected": (p) => `requested changes on ${q("en", p.title)}`,
  "comment.added": (p) => `commented on ${q("en", p.title)}`,
  "file.shared": (p) => (p.shared ? `shared ${p.file} with the client` : `stopped sharing ${p.file} with the client`),
  "file.deleted": (p) => `removed ${p.file} from ${q("en", p.title)}`,
  "file.uploaded": (p) => `uploaded ${p.file} to ${q("en", p.title)}`,
  "project.created": (p) => `created project ${q("en", p.name)} for ${p.client}`,
  "project.updated": (p) => `edited project ${q("en", p.name)}`,
  "module.added": (p) => `added the ${p.module} module to ${q("en", p.name)}`,
  "module.removed": (p) => `removed the ${p.module} module from ${q("en", p.name)}`,
  "module.updated": (p) => `updated ${p.module} details on ${q("en", p.name)}`,
  "brand.updated": () => "updated the brand settings",
  "client.created": (p) => `added client ${p.name}`,
  "client.updated": (p) => `updated client ${p.name}`,
  "user.created": (p, t) => `added ${p.name} (${role(t, p.role)})`,
  "user.updated": (p) => `updated ${p.name}`,
  "user.invited": (p, t) => `invited ${p.email} (${role(t, p.role)})`,
  "user.joined": () => "joined the workspace",
  "template.saved": (p) => `saved module template ${p.name}`,
  "billing.checkout": () => "opened checkout",
  "billing.plan": (p) => `changed the plan to ${p.plan}`,
  "billing.request": (p) => `chose the ${p.plan} plan`,
  "billing.transfer": (p) => `sent a bank transfer receipt for ${p.plan}`,
};

const AR: Record<string, Tpl> = {
  "task.created": (p) => `إنشاء المهمة ${q("ar", p.title)}`,
  "task.updated": (p) => `تعديل ${q("ar", p.title)}`,
  "task.assigned": (p) => (p.name ? `إسناد ${q("ar", p.title)} إلى ${p.name}` : `إلغاء إسناد ${q("ar", p.title)}`),
  "task.deleted": (p) => `حذف المهمة ${q("ar", p.title)}`,
  "task.status": (p, t) => `نقل ${q("ar", p.title)} من «${status(t, p.from)}» إلى «${status(t, p.to)}»`,
  "approval.requested": (p) => `طلب موافقة العميل على ${q("ar", p.title)}`,
  "approval.approved": (p) => `اعتماد ${q("ar", p.title)}`,
  "approval.rejected": (p) => `طلب تعديلات على ${q("ar", p.title)}`,
  "comment.added": (p) => `تعليق على ${q("ar", p.title)}`,
  "file.shared": (p) => (p.shared ? `مشاركة ${p.file} مع العميل` : `إيقاف مشاركة ${p.file} مع العميل`),
  "file.deleted": (p) => `حذف ${p.file} من ${q("ar", p.title)}`,
  "file.uploaded": (p) => `رفع ${p.file} إلى ${q("ar", p.title)}`,
  "project.created": (p) => `إنشاء المشروع ${q("ar", p.name)} للعميل ${p.client}`,
  "project.updated": (p) => `تعديل المشروع ${q("ar", p.name)}`,
  "module.added": (p) => `إضافة وحدة ${p.module} إلى ${q("ar", p.name)}`,
  "module.removed": (p) => `إزالة وحدة ${p.module} من ${q("ar", p.name)}`,
  "module.updated": (p) => `تحديث تفاصيل ${p.module} في ${q("ar", p.name)}`,
  "brand.updated": () => "تحديث إعدادات الهوية",
  "client.created": (p) => `إضافة العميل ${p.name}`,
  "client.updated": (p) => `تحديث بيانات العميل ${p.name}`,
  "user.created": (p, t) => `إضافة ${p.name} (${role(t, p.role)})`,
  "user.updated": (p) => `تحديث بيانات ${p.name}`,
  "user.invited": (p, t) => `دعوة ${p.email} (${role(t, p.role)})`,
  "user.joined": () => "الانضمام إلى مساحة العمل",
  "template.saved": (p) => `حفظ قالب الوحدة ${p.name}`,
  "billing.checkout": () => "فتح صفحة الدفع",
  "billing.plan": (p) => `تغيير الباقة إلى ${p.planAr || p.plan}`,
  "billing.request": (p) => `اختيار باقة ${p.planAr || p.plan}`,
  "billing.transfer": (p) => `إرسال إيصال تحويل لباقة ${p.planAr || p.plan}`,
};

function status(t: AppDict, s: string | undefined) {
  return (s && (t.taskStatus as Record<string, string>)[s]) || s || "";
}
function role(t: AppDict, r: string | undefined) {
  return (r && (t.roles as Record<string, string>)[r]) || r || "";
}

/** The entry's text in `lang`, or its stored English summary when it predates params. */
export function activityText(a: { action: string; summary: string; params: Record<string, string> | null }, lang: Lang, t: AppDict) {
  if (!a.params) return a.summary;
  const tpl = (lang === "ar" ? AR : EN)[a.action];
  return tpl ? tpl(a.params, t) : a.summary;
}
