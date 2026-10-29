import type { Lang } from "./i18n";

/*
 * Copy for the public demo (SHOW_DEMO_ACCOUNTS=true): its landing page and the bar shown inside a
 * visitor's private copy. Arabic first; both languages have the same shape.
 */

const ar = {
  meta: {
    title: "جرّب نظام إدارة الوكالة",
    description: "نظام لإدارة أعمال الوكالات: مشاريع ومهام واعتمادات عملاء ومحادثات وتقارير، باسم وكالتك وألوانها. جرّبه الآن دون تسجيل.",
  },
  product: "مساحة الوكالة",
  nav: { features: "المزايا", yours: "على مقاسك", signIn: "تسجيل الدخول", try: "جرّبه الآن" },
  hero: {
    title: "أدِر وكالتك من مساحة عمل تحمل اسمك.",
    sub: "المشاريع والمهام واعتمادات العملاء والمحادثات والتقارير، بالعربية والإنجليزية وبألوان علامتك. اختر الاسم والألوان، وادخل النظام كاملاً دون تسجيل.",
    cta: "اجعله لك وجرّبه",
    secondary: "ماذا بداخله",
  },
  studio: {
    title: "اجعله لك، ثم ادخل",
    sub: "الصفحة كلها تتلوّن بما تختاره. سيفتح النظام باسمك وألوانك، ومعه مشاريع وعملاء وكالة تجريبية لتجرّب عليها.",
    nameStep: "اسم الوكالة",
    namePlaceholder: "وكالتك",
    colorStep: "الألوان",
    primary: "اللون الأساسي",
    accent: "لون التمييز",
    presets: "مجموعات جاهزة",
    roleStep: "ادخل بصفتك",
    enter: "ادخل",
    entering: "نجهّز نسختك…",
    private: "نسختك خاصة بك: لا يرى تعديلاتك أحد غيرك، وتُحذف عند تسجيل الخروج أو بعد 8 ساعات.",
    roles: {
      admin: { title: "مدير الوكالة", body: "كل شيء: المشاريع والفريق والعملاء والتقارير والهوية والإعدادات." },
      employee: { title: "عضو في الفريق", body: "مهامه ومواعيده وتسجيل وقته ومحادثة الفريق." },
      client: { title: "العميل", body: "مشاريعه، والأعمال التي تنتظر اعتماده، وتواصل مباشر مع الوكالة." },
    },
  },
  preview: {
    dashboard: "لوحة التحكم",
    projects: "المشاريع",
    tasks: "المهام",
    approvals: "الاعتمادات",
    chat: "المحادثات",
    reports: "التقارير",
    greeting: "صباح الخير، سارة",
    active: "مشاريع نشطة",
    waiting: "بانتظار العميل",
    due: "مستحقة هذا الأسبوع",
    project: "حملة إطلاق الصيف",
    client: "مقهى بلوم",
    stages: ["الفكرة", "التصميم", "اعتماد العميل", "النشر"],
    approve: "اعتماد",
    changes: "طلب تعديل",
  },
  features: {
    title: "كل ما تحتاجه الوكالة، في مكان واحد",
    items: [
      { title: "مشاريع مبنية من وحدات", body: "كل مشروع يتكوّن من وحدات (سوشيال ميديا، فيديو، هوية…) لكل منها مراحلها، وتُنشأ مهمة لكل مرحلة تلقائياً." },
      { title: "اعتمادات العملاء", body: "المراحل التي تحتاج رأي العميل تصله ليعتمدها أو يطلب تعديلاً، مع التعليقات والملفات." },
      { title: "مهام ولوحة وتقويم", body: "قائمة ولوحة بالسحب والإفلات وتقويم للمواعيد، مع قوائم تحقق ومهام متكررة." },
      { title: "محادثات المشاريع والفريق", body: "محادثة لكل مشروع مع العميل، ومحادثة داخلية للفريق، وإشارات وتنبيهات." },
      { title: "الوقت والتقارير", body: "سجّل ساعات العمل لكل مهمة، واستخرج تقارير المهام والوقت بملف CSV." },
      { title: "عربي وإنجليزي", body: "واجهة كاملة باللغتين واتجاه صحيح من اليمين لليسار، وكل شخص يختار لغته." },
    ],
  },
  yours: {
    title: "يتشكّل على طريقة عملك",
    sub: "ليس قالباً جاهزاً تتأقلم معه، بل نظام تضبطه ليشبه وكالتك.",
    items: [
      { title: "هويتك", body: "الاسم والشعار والألوان في مساحة العمل وبوابة العملاء وحتى الرسائل." },
      { title: "سير عملك", body: "18 سير عمل جاهزاً حسب أقسام الوكالة، أو اكتب مراحلك بنفسك." },
      { title: "أدوارك", body: "المدير وعضو الفريق والعميل، كلٌّ يرى ما يخصّه فقط." },
      { title: "صفحتك", body: "صفحة تعريفية عامة لوكالتك مع نموذج تواصل يصل كعميل محتمل." },
    ],
  },
  closing: { title: "شاهده باسم وكالتك.", cta: "جرّبه الآن" },
  footer: "نسخة تجريبية ببيانات وهمية.",
  notices: {
    ended: "انتهت تجربتك وحُذفت نسختك بكل تعديلاتها.",
    busy: "بدأت تجارب كثيرة من اتصالك خلال الساعة الماضية. حاول لاحقاً.",
    unavailable: "تعذّر تجهيز التجربة الآن. حاول مجدداً.",
  },
  bar: {
    label: "تجربة",
    text: "هذه نسختك الخاصة: لا يرى تعديلاتك أحد غيرك، وتُحذف عند تسجيل الخروج.",
    viewAs: "اعرض بصفة",
    roles: { admin: "المدير", employee: "عضو الفريق", client: "العميل" },
    brand: "غيّر الهوية",
    end: "إنهاء التجربة",
  },
};

export type DemoDict = typeof ar;

const en: DemoDict = {
  meta: {
    title: "Try the agency workspace",
    description: "A workspace for agencies: projects, tasks, client approvals, chat and reports, in your agency's name and colours. Try it now, no sign-up.",
  },
  product: "Agency Workspace",
  nav: { features: "Features", yours: "Make it yours", signIn: "Sign in", try: "Try it now" },
  hero: {
    title: "Run your agency from a workspace with your name on it.",
    sub: "Projects, tasks, client approvals, chat and reports, in Arabic and English and in your brand's colours. Pick a name and colours, then step into the whole system without signing up.",
    cta: "Make it yours and try it",
    secondary: "See what's inside",
  },
  studio: {
    title: "Make it yours, then step inside",
    sub: "This whole page takes on what you pick. The system opens with your name and colours, filled with a sample agency's projects and clients to try things on.",
    nameStep: "Agency name",
    namePlaceholder: "Your agency",
    colorStep: "Colours",
    primary: "Main colour",
    accent: "Accent colour",
    presets: "Ready-made pairs",
    roleStep: "Enter as",
    enter: "Enter",
    entering: "Setting up your copy…",
    private: "Your copy is private: only you see what you change, and it's erased when you sign out, or after 8 hours.",
    roles: {
      admin: { title: "Agency admin", body: "Everything: projects, team, clients, reports, brand and settings." },
      employee: { title: "Team member", body: "Their tasks, deadlines, time tracking and team chat." },
      client: { title: "Client", body: "Their projects, the work waiting for their approval and a direct line to the agency." },
    },
  },
  preview: {
    dashboard: "Dashboard",
    projects: "Projects",
    tasks: "Tasks",
    approvals: "Approvals",
    chat: "Chat",
    reports: "Reports",
    greeting: "Good morning, Sara",
    active: "Active projects",
    waiting: "Waiting on client",
    due: "Due this week",
    project: "Summer launch campaign",
    client: "Bloom Café",
    stages: ["Idea", "Design", "Client approval", "Publish"],
    approve: "Approve",
    changes: "Request changes",
  },
  features: {
    title: "Everything an agency needs, in one place",
    items: [
      { title: "Projects built from modules", body: "Each project is made of modules (social media, video, branding…) with their own stages, and every stage becomes a task." },
      { title: "Client approvals", body: "Stages that need the client go to them to approve or request changes, with comments and files." },
      { title: "Tasks, board and calendar", body: "A list, a drag-and-drop board and a calendar of deadlines, with checklists and repeating tasks." },
      { title: "Project and team chat", body: "A chat with the client on every project, an internal team chat, mentions and notifications." },
      { title: "Time and reports", body: "Log hours against each task and export task and time reports as CSV." },
      { title: "Arabic and English", body: "The full interface in both languages, right-to-left done properly, and everyone picks their own." },
    ],
  },
  yours: {
    title: "Shaped around how you work",
    sub: "Not a template you adapt to, but a system you set up to look and run like your agency.",
    items: [
      { title: "Your brand", body: "Name, logo and colours across the workspace, the client portal and even the emails." },
      { title: "Your workflows", body: "18 ready workflows by agency function, or write your own stages." },
      { title: "Your roles", body: "Admins, team members and clients each see only what's theirs." },
      { title: "Your page", body: "A public page for your agency with a contact form that arrives as a lead." },
    ],
  },
  closing: { title: "See it with your agency's name on it.", cta: "Try it now" },
  footer: "Demo with sample data.",
  notices: {
    ended: "Your demo has ended and your copy was erased with all its changes.",
    busy: "Too many demos started from your connection in the last hour. Please try again later.",
    unavailable: "The demo couldn't be set up just now. Please try again.",
  },
  bar: {
    label: "Demo",
    text: "This is your private copy: only you see your changes, and they're erased when you sign out.",
    viewAs: "View as",
    roles: { admin: "Admin", employee: "Team member", client: "Client" },
    brand: "Change the brand",
    end: "End demo",
  },
};

export const DEMO_DICT: Record<Lang, DemoDict> = { ar, en };
