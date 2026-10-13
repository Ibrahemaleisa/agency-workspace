import type { ModuleField, WorkflowStage } from "@/db/schema";
import type { Lang } from "./i18n";

/*
 * The template library: one workflow per function of a marketing agency (a service it delivers),
 * in English and Arabic. Admins add the ones their agency offers from Templates → Library; new
 * workspaces start with the STARTER set. A template is added in one language (the workspace's
 * default), because each stage name becomes the stage of the tasks it creates.
 * Keep templates to 5–7 stages: every stage is one task in the project. ✓ = client approves.
 */
type Text = { en: string; ar: string };
type LibStage = Text & { approval?: true };
type LibField = { key: string; label: Text; type: ModuleField["type"]; options?: { en: string[]; ar: string[] } };

export type LibraryTemplate = {
  key: string;
  color: string;
  name: Text;
  description: Text;
  stages: LibStage[];
  fields: LibField[];
};

export const TEMPLATE_LIBRARY: LibraryTemplate[] = [
  {
    key: "strategy",
    color: "slate",
    name: { en: "Strategy & Planning", ar: "الاستراتيجية والتخطيط" },
    description: { en: "Research, positioning and the plan the rest of the work follows.", ar: "البحث والتموضع والخطة التي يسير عليها باقي العمل." },
    stages: [
      { en: "Brief", ar: "الموجز" },
      { en: "Research & Analysis", ar: "البحث والتحليل" },
      { en: "Strategy Draft", ar: "مسودة الاستراتيجية" },
      { en: "Client Approval", ar: "موافقة العميل", approval: true },
      { en: "Final Strategy", ar: "الاستراتيجية النهائية" },
    ],
    fields: [
      { key: "objective", label: { en: "Business objective", ar: "الهدف التجاري" }, type: "textarea" },
      { key: "audience", label: { en: "Target audience", ar: "الجمهور المستهدف" }, type: "textarea" },
      { key: "period", label: { en: "Plan period", ar: "مدة الخطة" }, type: "select", options: { en: ["Quarter", "Half year", "Year"], ar: ["ربع سنة", "نصف سنة", "سنة"] } },
    ],
  },
  {
    key: "social-media",
    color: "violet",
    name: { en: "Social Media Management", ar: "إدارة السوشال ميديا" },
    description: { en: "The monthly content cycle, from plan to published posts.", ar: "دورة المحتوى الشهرية من الخطة حتى نشر المنشورات." },
    stages: [
      { en: "Monthly Plan", ar: "الخطة الشهرية", approval: true },
      { en: "Content Writing", ar: "كتابة المحتوى" },
      { en: "Design", ar: "التصميم" },
      { en: "Internal Review", ar: "مراجعة داخلية" },
      { en: "Client Approval", ar: "موافقة العميل", approval: true },
      { en: "Scheduling", ar: "الجدولة" },
      { en: "Published", ar: "النشر" },
    ],
    fields: [
      { key: "month", label: { en: "Month", ar: "الشهر" }, type: "date" },
      { key: "platforms", label: { en: "Platforms", ar: "المنصات" }, type: "text" },
      { key: "posts", label: { en: "Posts this month", ar: "عدد المنشورات" }, type: "number" },
      { key: "dialect", label: { en: "Language / dialect", ar: "اللغة / اللهجة" }, type: "select", options: { en: ["Saudi dialect", "Modern Standard Arabic", "English", "Arabic + English"], ar: ["لهجة سعودية", "فصحى", "إنجليزي", "عربي + إنجليزي"] } },
    ],
  },
  {
    key: "copywriting",
    color: "blue",
    name: { en: "Copywriting", ar: "كتابة المحتوى" },
    description: { en: "Captions, scripts, website and ad copy.", ar: "النصوص والسكربتات ونصوص المواقع والإعلانات." },
    stages: [
      { en: "Brief", ar: "الموجز" },
      { en: "First Draft", ar: "المسودة الأولى" },
      { en: "Internal Review", ar: "مراجعة داخلية" },
      { en: "Client Approval", ar: "موافقة العميل", approval: true },
      { en: "Final Copy", ar: "النص النهائي" },
    ],
    fields: [
      { key: "copyType", label: { en: "Copy type", ar: "نوع النص" }, type: "select", options: { en: ["Social captions", "Video script", "Website", "Ads", "Article"], ar: ["نصوص سوشال", "سكربت فيديو", "موقع إلكتروني", "إعلانات", "مقال"] } },
      { key: "language", label: { en: "Language", ar: "اللغة" }, type: "select", options: { en: ["Arabic", "English", "Arabic + English"], ar: ["عربي", "إنجليزي", "عربي + إنجليزي"] } },
      { key: "tone", label: { en: "Tone of voice", ar: "نبرة الكتابة" }, type: "text" },
    ],
  },
  {
    key: "graphic-design",
    color: "pink",
    name: { en: "Graphic Design", ar: "التصميم الجرافيكي" },
    description: { en: "Posts, ads, print and presentations.", ar: "المنشورات والإعلانات والمطبوعات والعروض." },
    stages: [
      { en: "Brief", ar: "الموجز" },
      { en: "Concept", ar: "الفكرة" },
      { en: "Design", ar: "التصميم" },
      { en: "Internal Review", ar: "مراجعة داخلية" },
      { en: "Client Approval", ar: "موافقة العميل", approval: true },
      { en: "Final Files", ar: "الملفات النهائية" },
    ],
    fields: [
      { key: "deliverables", label: { en: "Deliverables", ar: "المخرجات" }, type: "textarea" },
      { key: "sizes", label: { en: "Sizes / formats", ar: "المقاسات / الصيغ" }, type: "text" },
      { key: "guidelines", label: { en: "Brand guidelines link", ar: "رابط دليل الهوية" }, type: "url" },
    ],
  },
  {
    key: "video-motion",
    color: "pink",
    name: { en: "Video & Motion", ar: "الفيديو والموشن" },
    description: { en: "Filmed and animated video, from idea to delivery.", ar: "الفيديو المصوّر والمتحرك من الفكرة حتى التسليم." },
    stages: [
      { en: "Idea & Script", ar: "الفكرة والسيناريو", approval: true },
      { en: "Storyboard", ar: "الستوري بورد" },
      { en: "Shoot / Animate", ar: "التصوير / التحريك" },
      { en: "Editing", ar: "المونتاج" },
      { en: "Client Review", ar: "مراجعة العميل", approval: true },
      { en: "Delivery", ar: "التسليم" },
    ],
    fields: [
      { key: "duration", label: { en: "Length (seconds)", ar: "المدة (ثانية)" }, type: "number" },
      { key: "format", label: { en: "Format", ar: "المقاس" }, type: "select", options: { en: ["9:16 vertical", "16:9 horizontal", "1:1 square"], ar: ["عمودي 9:16", "أفقي 16:9", "مربع 1:1"] } },
      { key: "shootDate", label: { en: "Shoot date", ar: "تاريخ التصوير" }, type: "date" },
      { key: "voiceOver", label: { en: "Voice-over", ar: "التعليق الصوتي" }, type: "select", options: { en: ["Arabic", "English", "None"], ar: ["عربي", "إنجليزي", "بدون"] } },
    ],
  },
  {
    key: "photography",
    color: "teal",
    name: { en: "Photography", ar: "التصوير الفوتوغرافي" },
    description: { en: "Product, people and location shoots.", ar: "تصوير المنتجات والأشخاص والمواقع." },
    stages: [
      { en: "Shot List", ar: "قائمة اللقطات", approval: true },
      { en: "Preparation", ar: "التحضير" },
      { en: "Shoot", ar: "التصوير" },
      { en: "Selection & Retouching", ar: "الفرز والتعديل" },
      { en: "Client Approval", ar: "موافقة العميل", approval: true },
      { en: "Delivery", ar: "التسليم" },
    ],
    fields: [
      { key: "shootDate", label: { en: "Shoot date", ar: "تاريخ التصوير" }, type: "date" },
      { key: "location", label: { en: "Location", ar: "الموقع" }, type: "text" },
      { key: "images", label: { en: "Final images", ar: "عدد الصور النهائية" }, type: "number" },
    ],
  },
  {
    key: "branding",
    color: "violet",
    name: { en: "Branding", ar: "الهوية البصرية" },
    description: { en: "Logo, visual identity and brand guidelines.", ar: "الشعار والهوية البصرية ودليل الهوية." },
    stages: [
      { en: "Discovery", ar: "الاستكشاف" },
      { en: "Concepts", ar: "المقترحات", approval: true },
      { en: "Development", ar: "التطوير" },
      { en: "Brand Guidelines", ar: "دليل الهوية", approval: true },
      { en: "Handover", ar: "التسليم" },
    ],
    fields: [
      { key: "concepts", label: { en: "Concepts to present", ar: "عدد المقترحات" }, type: "number" },
      { key: "bilingual", label: { en: "Bilingual logo", ar: "شعار ثنائي اللغة" }, type: "select", options: { en: ["Yes", "No"], ar: ["نعم", "لا"] } },
      { key: "industry", label: { en: "Industry", ar: "القطاع" }, type: "text" },
    ],
  },
  {
    key: "paid-ads",
    color: "teal",
    name: { en: "Paid Ads / Performance", ar: "الإعلانات الممولة" },
    description: { en: "Campaigns on ad platforms, run against a target.", ar: "الحملات على المنصات الإعلانية وفق هدف محدد." },
    stages: [
      { en: "Media Plan", ar: "الخطة الإعلانية", approval: true },
      { en: "Ad Creatives", ar: "التصاميم الإعلانية", approval: true },
      { en: "Setup", ar: "الإعداد" },
      { en: "Live", ar: "الإطلاق" },
      { en: "Optimization", ar: "التحسين" },
      { en: "Report", ar: "التقرير" },
    ],
    fields: [
      { key: "platforms", label: { en: "Platforms", ar: "المنصات" }, type: "text" },
      { key: "budget", label: { en: "Monthly budget (SAR)", ar: "الميزانية الشهرية (ر.س)" }, type: "number" },
      { key: "objective", label: { en: "Objective", ar: "الهدف" }, type: "select", options: { en: ["Awareness", "Traffic", "Leads", "Sales", "App installs"], ar: ["الوعي", "الزيارات", "العملاء المحتملون", "المبيعات", "تحميل التطبيق"] } },
      { key: "kpi", label: { en: "Target (KPI)", ar: "المؤشر المستهدف" }, type: "text" },
    ],
  },
  {
    key: "media-buying",
    color: "slate",
    name: { en: "Media Buying", ar: "شراء الوسائط" },
    description: { en: "Booking outdoor, TV, radio, print and digital placements.", ar: "حجز الإعلانات الخارجية والتلفزيون والإذاعة والمطبوعات والرقمي." },
    stages: [
      { en: "Brief", ar: "الموجز" },
      { en: "Media Plan", ar: "خطة الوسائط", approval: true },
      { en: "Booking", ar: "الحجز" },
      { en: "Materials Delivery", ar: "تسليم المواد" },
      { en: "Live Monitoring", ar: "المتابعة أثناء العرض" },
      { en: "Proof of Posting", ar: "إثبات النشر" },
    ],
    fields: [
      { key: "channels", label: { en: "Media channels", ar: "قنوات الوسائط" }, type: "text" },
      { key: "budget", label: { en: "Budget (SAR)", ar: "الميزانية (ر.س)" }, type: "number" },
      { key: "flightStart", label: { en: "Start date", ar: "تاريخ البدء" }, type: "date" },
      { key: "flightEnd", label: { en: "End date", ar: "تاريخ الانتهاء" }, type: "date" },
    ],
  },
  {
    key: "seo",
    color: "green",
    name: { en: "SEO", ar: "تحسين محركات البحث" },
    description: { en: "Search visibility, month after month.", ar: "الظهور في نتائج البحث شهراً بعد شهر." },
    stages: [
      { en: "Audit", ar: "التدقيق" },
      { en: "Keyword Plan", ar: "خطة الكلمات المفتاحية", approval: true },
      { en: "On-page Fixes", ar: "تحسينات الصفحات" },
      { en: "Content", ar: "المحتوى" },
      { en: "Monthly Report", ar: "التقرير الشهري", approval: true },
    ],
    fields: [
      { key: "website", label: { en: "Website", ar: "الموقع" }, type: "url" },
      { key: "keywords", label: { en: "Target keywords", ar: "الكلمات المستهدفة" }, type: "textarea" },
      { key: "market", label: { en: "Market", ar: "السوق" }, type: "select", options: { en: ["Saudi Arabia", "GCC", "MENA"], ar: ["السعودية", "الخليج", "الشرق الأوسط وشمال أفريقيا"] } },
    ],
  },
  {
    key: "influencer",
    color: "pink",
    name: { en: "Influencer Marketing", ar: "التسويق عبر المؤثرين" },
    description: { en: "Choosing, contracting and running creators.", ar: "اختيار المؤثرين والتعاقد معهم وإدارة محتواهم." },
    stages: [
      { en: "Shortlist", ar: "ترشيح المؤثرين", approval: true },
      { en: "Contracting", ar: "التعاقد" },
      { en: "Content Drafts", ar: "مسودات المحتوى", approval: true },
      { en: "Publishing", ar: "النشر" },
      { en: "Report", ar: "التقرير" },
    ],
    fields: [
      { key: "platforms", label: { en: "Platforms", ar: "المنصات" }, type: "text" },
      { key: "influencers", label: { en: "Number of influencers", ar: "عدد المؤثرين" }, type: "number" },
      { key: "budget", label: { en: "Budget (SAR)", ar: "الميزانية (ر.س)" }, type: "number" },
    ],
  },
  {
    key: "community",
    color: "blue",
    name: { en: "Community Management", ar: "إدارة المجتمع والردود" },
    description: { en: "Replies, messages and escalations on the brand's accounts.", ar: "الردود والرسائل والتصعيد على حسابات العلامة." },
    stages: [
      { en: "Reply Guidelines", ar: "دليل الردود", approval: true },
      { en: "Daily Monitoring", ar: "المتابعة اليومية" },
      { en: "Escalations", ar: "التصعيد" },
      { en: "Weekly Summary", ar: "الملخص الأسبوعي" },
    ],
    fields: [
      { key: "platforms", label: { en: "Platforms", ar: "المنصات" }, type: "text" },
      { key: "hours", label: { en: "Coverage hours", ar: "ساعات التغطية" }, type: "text" },
      { key: "responseTime", label: { en: "Target response time", ar: "وقت الرد المستهدف" }, type: "text" },
    ],
  },
  {
    key: "pr",
    color: "slate",
    name: { en: "PR & Communications", ar: "العلاقات العامة" },
    description: { en: "Press releases, media relations and coverage.", ar: "البيانات الصحفية والعلاقات الإعلامية والتغطية." },
    stages: [
      { en: "Story Angle", ar: "زاوية الخبر" },
      { en: "Press Release Draft", ar: "مسودة البيان الصحفي" },
      { en: "Client Approval", ar: "موافقة العميل", approval: true },
      { en: "Distribution", ar: "التوزيع" },
      { en: "Coverage Report", ar: "تقرير التغطية" },
    ],
    fields: [
      { key: "releaseDate", label: { en: "Release date", ar: "تاريخ النشر" }, type: "date" },
      { key: "outlets", label: { en: "Target media", ar: "الوسائل الإعلامية المستهدفة" }, type: "textarea" },
      { key: "spokesperson", label: { en: "Spokesperson", ar: "المتحدث الرسمي" }, type: "text" },
    ],
  },
  {
    key: "web",
    color: "blue",
    name: { en: "Web Design & Development", ar: "تصميم وتطوير المواقع" },
    description: { en: "Websites and landing pages, Arabic and English.", ar: "المواقع وصفحات الهبوط بالعربية والإنجليزية." },
    stages: [
      { en: "Requirements", ar: "المتطلبات" },
      { en: "Wireframes", ar: "المخططات", approval: true },
      { en: "UI Design", ar: "تصميم الواجهات", approval: true },
      { en: "Development", ar: "التطوير" },
      { en: "Testing", ar: "الاختبار" },
      { en: "Client Acceptance", ar: "قبول العميل", approval: true },
      { en: "Launch", ar: "الإطلاق" },
    ],
    fields: [
      { key: "domain", label: { en: "Domain", ar: "النطاق" }, type: "url" },
      { key: "pages", label: { en: "Number of pages", ar: "عدد الصفحات" }, type: "number" },
      { key: "languages", label: { en: "Languages", ar: "اللغات" }, type: "select", options: { en: ["Arabic", "English", "Arabic + English"], ar: ["عربي", "إنجليزي", "عربي + إنجليزي"] } },
      { key: "platform", label: { en: "Platform / CMS", ar: "المنصة" }, type: "text" },
    ],
  },
  {
    key: "email-crm",
    color: "green",
    name: { en: "Email & CRM Marketing", ar: "التسويق بالبريد وإدارة العملاء" },
    description: { en: "Newsletters, automated messages and SMS.", ar: "النشرات البريدية والرسائل الآلية والرسائل النصية." },
    stages: [
      { en: "Plan", ar: "الخطة" },
      { en: "Copy & Design", ar: "النص والتصميم" },
      { en: "Client Approval", ar: "موافقة العميل", approval: true },
      { en: "Setup & Testing", ar: "الإعداد والاختبار" },
      { en: "Send", ar: "الإرسال" },
      { en: "Results", ar: "النتائج" },
    ],
    fields: [
      { key: "channel", label: { en: "Channel", ar: "القناة" }, type: "select", options: { en: ["Email", "SMS", "WhatsApp"], ar: ["بريد إلكتروني", "رسائل نصية", "واتساب"] } },
      { key: "audienceSize", label: { en: "Audience size", ar: "حجم الجمهور" }, type: "number" },
      { key: "sendDate", label: { en: "Send date", ar: "تاريخ الإرسال" }, type: "date" },
    ],
  },
  {
    key: "events",
    color: "violet",
    name: { en: "Events & Activations", ar: "الفعاليات والتفعيلات" },
    description: { en: "Launches, booths, exhibitions and on-ground activations.", ar: "حفلات الإطلاق والأجنحة والمعارض والتفعيلات الميدانية." },
    stages: [
      { en: "Concept", ar: "الفكرة", approval: true },
      { en: "Venue & Suppliers", ar: "المكان والموردون" },
      { en: "Branding & Print", ar: "الهوية والمطبوعات", approval: true },
      { en: "Execution", ar: "التنفيذ" },
      { en: "Post-event Report", ar: "تقرير ما بعد الفعالية" },
    ],
    fields: [
      { key: "eventDate", label: { en: "Event date", ar: "تاريخ الفعالية" }, type: "date" },
      { key: "city", label: { en: "City", ar: "المدينة" }, type: "text" },
      { key: "attendees", label: { en: "Expected attendees", ar: "عدد الحضور المتوقع" }, type: "number" },
      { key: "budget", label: { en: "Budget (SAR)", ar: "الميزانية (ر.س)" }, type: "number" },
    ],
  },
  {
    key: "reporting",
    color: "green",
    name: { en: "Analytics & Reporting", ar: "التحليلات والتقارير" },
    description: { en: "Results the client can read, every month.", ar: "نتائج واضحة للعميل كل شهر." },
    stages: [
      { en: "Data Collection", ar: "جمع البيانات" },
      { en: "Analysis", ar: "التحليل" },
      { en: "Report Draft", ar: "مسودة التقرير" },
      { en: "Client Review", ar: "مراجعة العميل", approval: true },
      { en: "Meeting", ar: "الاجتماع" },
    ],
    fields: [
      { key: "month", label: { en: "Month", ar: "الشهر" }, type: "date" },
      { key: "channels", label: { en: "Channels covered", ar: "القنوات المشمولة" }, type: "text" },
      { key: "reportLink", label: { en: "Report link", ar: "رابط التقرير" }, type: "url" },
    ],
  },
  {
    key: "account-management",
    color: "slate",
    name: { en: "Account Management", ar: "إدارة الحسابات" },
    description: { en: "The client relationship: onboarding, meetings and monthly review.", ar: "العلاقة مع العميل: الانضمام والاجتماعات والمراجعة الشهرية." },
    stages: [
      { en: "Onboarding", ar: "تهيئة العميل" },
      { en: "Kickoff", ar: "اجتماع الانطلاق" },
      { en: "Monthly Planning", ar: "التخطيط الشهري" },
      { en: "Status Meetings", ar: "اجتماعات المتابعة" },
      { en: "Monthly Report", ar: "التقرير الشهري", approval: true },
    ],
    fields: [
      { key: "cadence", label: { en: "Meeting cadence", ar: "دورية الاجتماعات" }, type: "select", options: { en: ["Weekly", "Every two weeks", "Monthly"], ar: ["أسبوعي", "كل أسبوعين", "شهري"] } },
      { key: "primaryContact", label: { en: "Client contact", ar: "جهة التواصل لدى العميل" }, type: "text" },
      { key: "renewalDate", label: { en: "Contract renewal", ar: "تجديد العقد" }, type: "date" },
    ],
  },
];

/** What a new workspace starts with (the rest are one click away in the library). */
export const STARTER_TEMPLATES = ["social-media", "graphic-design", "video-motion", "paid-ads", "reporting", "account-management"];

/** A library template as a workspace's module template, in one language. */
export function libraryTemplate(t: LibraryTemplate, lang: Lang) {
  const stages: WorkflowStage[] = t.stages.map((s) => ({ name: s[lang], ...(s.approval ? { clientApproval: true } : {}) }));
  const fields: ModuleField[] = t.fields.map((f) => ({
    key: f.key,
    label: f.label[lang],
    type: f.type,
    ...(f.options ? { options: f.options[lang] } : {}),
  }));
  return { name: t.name[lang], description: t.description[lang], color: t.color, stages, fields, sourceKey: t.key };
}

export const findLibraryTemplate = (key: string) => TEMPLATE_LIBRARY.find((t) => t.key === key) ?? null;
