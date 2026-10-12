/**
 * Terms of Service and Privacy Policy, in English and Arabic.
 *
 * Placeholders, filled from the deployment's settings (lib/legal.ts):
 *   {operator}     who provides the service (LEGAL_ENTITY_NAME; the workspace's name on a single-agency deployment)
 *   {email}        where to write (LEGAL_CONTACT_EMAIL)
 *   {jurisdiction} governing law (LEGAL_JURISDICTION, default the Kingdom of Saudi Arabia)
 *   {effective}    date these terms took effect (LEGAL_EFFECTIVE_DATE)
 *
 * IMPORTANT: a sound starting text, not legal advice. Have a lawyer in your jurisdiction review it
 * (in particular for the Saudi Personal Data Protection Law and e-commerce rules) before relying on it.
 */
export type LegalSection = { title: string; body: string[] };
export type LegalDoc = { title: string; updated: string; intro: string; sections: LegalSection[] };

const termsEn: LegalDoc = {
  title: "Terms of Service",
  updated: "Effective {effective}",
  intro:
    "These terms are an agreement between you and {operator} (“we”, “us”) for the use of this project-management service (the “Service”). By creating an account, joining a workspace or using the Service, you accept them. If you accept them for a company, you confirm you may bind that company.",
  sections: [
    {
      title: "1. The Service",
      body: [
        "The Service lets an agency (the “Customer”) run projects, tasks, approvals, files and conversations with its team and its clients inside its own workspace.",
        "We may improve or change features. If we remove a feature you rely on in a material way, we will tell workspace admins in advance where reasonably possible.",
      ],
    },
    {
      title: "2. Accounts",
      body: [
        "You must give accurate details, keep your password secret and tell us at {email} if you suspect someone else is using your account. You are responsible for what happens under your account.",
        "Workspace admins decide who joins their workspace and what each person may see. A person invited by a Customer uses the Service under that Customer’s responsibility.",
      ],
    },
    {
      title: "3. Free trial, plans and payment",
      body: [
        "New workspaces may start with a free trial. When it ends, the workspace becomes read-only for changes until a plan is active; nothing is deleted at that moment.",
        "Prices, limits (team members, clients, storage) and billing periods are shown on the billing page when you subscribe. Paid plans renew for the same period until cancelled. Card payments are processed by our payment provider, which may act as merchant of record and issue the receipt.",
        "You can cancel at any time: the plan then stays active until the end of the period already paid. Except where the law requires otherwise, payments for a period that has started are not refunded.",
        "If a payment fails, we may limit the workspace after notice until it is settled.",
      ],
    },
    {
      title: "4. Your content",
      body: [
        "Everything the Customer and its people put into a workspace (projects, tasks, comments, files, client details) is “Customer Content”. The Customer owns it. We use it only to provide, secure and support the Service, as described in the Privacy Policy.",
        "You confirm you have the right to upload Customer Content and that it doesn’t break the law or anyone’s rights.",
        "Admins can export the workspace’s data at any time (Settings → Export your data) and can delete the workspace. After deletion the data is removed from the Service; backups held by our hosting providers expire on their normal schedule.",
      ],
    },
    {
      title: "5. Acceptable use",
      body: [
        "Do not use the Service to break the law, to send spam, to upload malware, to infringe others’ rights, to try to access other workspaces or our systems without permission, or to overload the Service.",
        "We may suspend an account or workspace that breaks these rules or puts the Service or other customers at risk, and will tell the admins why unless the law or security prevents it.",
      ],
    },
    {
      title: "6. Availability and support",
      body: [
        "We work to keep the Service available and secure, but we don’t promise it will be uninterrupted or error-free. Planned maintenance will be kept short and, where possible, announced.",
        "Support is provided by email at {email}.",
      ],
    },
    {
      title: "7. Liability",
      body: [
        "The Service is provided “as is” to the extent the law allows. We are not liable for indirect or consequential losses, lost profits or lost data that could have been avoided by exporting it.",
        "Our total liability for any claim is limited to the amounts the Customer paid us in the twelve months before the claim. Nothing here limits liability that the law does not allow to be limited.",
      ],
    },
    {
      title: "8. Ending the agreement",
      body: [
        "You may stop using the Service and delete your account or workspace at any time. We may end the agreement with thirty days’ notice, or immediately for a serious breach of these terms.",
      ],
    },
    {
      title: "9. Changes and law",
      body: [
        "We may update these terms. For material changes we will notify workspace admins at least fourteen days before they apply; continuing to use the Service after that means you accept them.",
        "These terms are governed by the laws of {jurisdiction}, whose competent courts have jurisdiction over any dispute.",
        "Questions: {email}.",
      ],
    },
  ],
};

const termsAr: LegalDoc = {
  title: "شروط الخدمة",
  updated: "سارية من {effective}",
  intro:
    "هذه الشروط اتفاق بينك وبين {operator} («نحن») لاستخدام خدمة إدارة المشاريع هذه («الخدمة»). بإنشاء حساب أو الانضمام إلى مساحة عمل أو استخدام الخدمة فإنك تقبلها. وإن قبلتها نيابةً عن شركة فإنك تؤكد أنك مخوّل بإلزامها.",
  sections: [
    {
      title: "1. الخدمة",
      body: [
        "تتيح الخدمة للوكالة («العميل») إدارة المشاريع والمهام والموافقات والملفات والمحادثات مع فريقها وعملائها داخل مساحة عمل خاصة بها.",
        "قد نطوّر الميزات أو نغيّرها. وإن أزلنا ميزة تعتمد عليها اعتماداً جوهرياً فسنُعلم مديري مساحة العمل مسبقاً قدر الإمكان.",
      ],
    },
    {
      title: "2. الحسابات",
      body: [
        "عليك تقديم بيانات صحيحة والمحافظة على سرية كلمة المرور وإبلاغنا على {email} إن اشتبهت في استخدام غيرك لحسابك. وأنت مسؤول عمّا يحدث عبر حسابك.",
        "يقرر مديرو مساحة العمل من ينضم إليها وما يراه كل شخص. ومن يدعوه العميل يستخدم الخدمة تحت مسؤولية ذلك العميل.",
      ],
    },
    {
      title: "3. التجربة المجانية والباقات والدفع",
      body: [
        "قد تبدأ مساحات العمل الجديدة بتجربة مجانية. وعند انتهائها تُقفل التعديلات حتى تُفعَّل باقة، ولا يُحذف شيء حينها.",
        "تظهر الأسعار والحدود (أعضاء الفريق والعملاء والتخزين) وفترات الفوترة في صفحة الفوترة عند الاشتراك. وتتجدد الباقات المدفوعة للفترة نفسها حتى إلغائها. ويعالج مزوّد الدفع مدفوعات البطاقات، وقد يكون هو البائع الرسمي ومُصدر الإيصال.",
        "يمكنك الإلغاء في أي وقت، وتبقى الباقة فعّالة حتى نهاية الفترة المدفوعة. وما لم يقتضِ النظام خلاف ذلك فلا تُسترد مدفوعات فترة بدأت.",
        "إن تعذّر الدفع فقد نقيّد مساحة العمل بعد الإشعار حتى تتم التسوية.",
      ],
    },
    {
      title: "4. محتواك",
      body: [
        "كل ما يضعه العميل وفريقه في مساحة العمل (المشاريع والمهام والتعليقات والملفات وبيانات العملاء) هو «محتوى العميل» وملك له. ولا نستخدمه إلا لتقديم الخدمة وتأمينها ودعمها كما توضح سياسة الخصوصية.",
        "تؤكد أن لك الحق في رفع محتوى العميل وأنه لا يخالف النظام ولا حقوق أحد.",
        "يمكن للمديرين تصدير بيانات مساحة العمل في أي وقت (الإعدادات ← تصدير بياناتك) وحذف مساحة العمل. وبعد الحذف تُزال البيانات من الخدمة، وتنتهي النسخ الاحتياطية لدى مزوّدي الاستضافة وفق جدولها المعتاد.",
      ],
    },
    {
      title: "5. الاستخدام المقبول",
      body: [
        "لا تستخدم الخدمة لمخالفة النظام أو إرسال رسائل مزعجة أو رفع برمجيات ضارة أو التعدي على حقوق الآخرين أو محاولة الوصول إلى مساحات عمل أخرى أو أنظمتنا دون إذن أو إثقال الخدمة.",
        "قد نعلّق حساباً أو مساحة عمل تخالف هذه القواعد أو تعرّض الخدمة أو العملاء الآخرين للخطر، ونُبلغ المديرين بالسبب ما لم يمنع ذلك النظام أو دواعي الأمن.",
      ],
    },
    {
      title: "6. التوفر والدعم",
      body: [
        "نعمل على إبقاء الخدمة متاحة وآمنة، لكننا لا نضمن أن تعمل دون انقطاع أو أخطاء. ونُبقي الصيانة المخطط لها قصيرة ونعلن عنها قدر الإمكان.",
        "يُقدَّم الدعم عبر البريد على {email}.",
      ],
    },
    {
      title: "7. المسؤولية",
      body: [
        "تُقدَّم الخدمة «كما هي» في حدود ما يسمح به النظام. ولسنا مسؤولين عن الخسائر غير المباشرة أو التبعية أو فوات الأرباح أو فقدان بيانات كان يمكن تفاديه بتصديرها.",
        "تقتصر مسؤوليتنا الإجمالية عن أي مطالبة على ما دفعه العميل لنا خلال الاثني عشر شهراً السابقة لها. ولا يحدّ شيء هنا من مسؤولية لا يجيز النظام تحديدها.",
      ],
    },
    {
      title: "8. إنهاء الاتفاق",
      body: ["يمكنك التوقف عن استخدام الخدمة وحذف حسابك أو مساحة عملك في أي وقت. ويجوز لنا إنهاء الاتفاق بإشعار مدته ثلاثون يوماً، أو فوراً عند مخالفة جسيمة لهذه الشروط."],
    },
    {
      title: "9. التعديلات والنظام المطبّق",
      body: [
        "قد نحدّث هذه الشروط. وفي التغييرات الجوهرية نُشعر مديري مساحات العمل قبل سريانها بأربعة عشر يوماً على الأقل، ويعني الاستمرار في الاستخدام بعدها قبولها.",
        "تخضع هذه الشروط لأنظمة {jurisdiction}، وتختص محاكمها المختصة بأي نزاع.",
        "للاستفسار: {email}.",
      ],
    },
  ],
};

const privacyEn: LegalDoc = {
  title: "Privacy Policy",
  updated: "Effective {effective}",
  intro:
    "This policy explains what personal data {operator} processes when you use this service, why, and your rights. For the content an agency puts into its workspace (for example its clients’ details), that agency decides why and how it is used; we process it on the agency’s behalf.",
  sections: [
    {
      title: "1. What we collect",
      body: [
        "Account data: your name, email address, password (stored only as a one-way hash), language and job title.",
        "Workspace content: projects, tasks, comments, messages, files and client details that you and your team add.",
        "Billing data: plan, invoices and, for bank transfers, the receipt you upload. Card details go directly to our payment provider; we never see or store them.",
        "Usage and security data: sign-in times, the country derived from your connection (not your IP address), pages viewed on our website through a first-party anonymous identifier, and error logs.",
      ],
    },
    {
      title: "2. Why we use it",
      body: [
        "To provide the Service and its features (including the notification emails you can switch off in Settings), to keep it secure and prevent abuse, to bill paid plans, to provide support, and to understand in aggregate how the product and website are used so we can improve them.",
        "Our legal bases are performing our contract with you or your agency, our legitimate interest in a secure and improving service, compliance with the law (for example keeping invoices), and your consent where it is required.",
      ],
    },
    {
      title: "3. Who we share it with",
      body: [
        "Service providers that host and run the Service on our behalf, under contracts that protect the data: cloud hosting and database, file storage, email delivery and, for paid plans, the payment provider.",
        "Inside a workspace, what others can see is set by the agency’s admins (for example, clients only see what is shared with them).",
        "We do not sell personal data and do not use it for advertising. We disclose data to authorities only when the law requires it.",
      ],
    },
    {
      title: "4. Where it is stored and for how long",
      body: [
        "Data may be processed outside your country by our hosting providers, with appropriate safeguards.",
        "Workspace content is kept while the workspace exists and is removed when it is deleted. Abandoned sign-ups are kept up to 180 days (without the password), read notifications 90 days, website analytics about 13 months, and invoices as long as tax law requires.",
      ],
    },
    {
      title: "5. Security",
      body: [
        "Passwords are hashed, connections are encrypted, files are stored privately and only served after an access check, workspaces are isolated from each other, and staff access to the control center requires two-step sign-in.",
      ],
    },
    {
      title: "6. Your rights",
      body: [
        "You can see and correct your profile in Settings, change your password, switch off notification emails, and delete your account. Agency admins can export or delete their workspace’s data.",
        "You may also ask us to access, correct, delete or transfer your data, or object to its use, by writing to {email}. If you are a member of an agency’s workspace, we may pass your request to that agency. You can complain to the data-protection authority in your country.",
      ],
    },
    {
      title: "7. Cookies",
      body: [
        "We use only necessary cookies: your sign-in session, your language, which workspace you last used, and an anonymous visitor identifier for our own sign-up statistics. No third-party advertising or tracking cookies.",
      ],
    },
    {
      title: "8. Changes and contact",
      body: [
        "We will post changes here and tell workspace admins about material ones. Questions or requests: {email}.",
      ],
    },
  ],
};

const privacyAr: LegalDoc = {
  title: "سياسة الخصوصية",
  updated: "سارية من {effective}",
  intro:
    "توضح هذه السياسة البيانات الشخصية التي يعالجها {operator} عند استخدامك هذه الخدمة، ولماذا، وما حقوقك. أما المحتوى الذي تضعه الوكالة في مساحة عملها (كبيانات عملائها) فالوكالة هي من يقرر سبب استخدامه وكيفيته، ونحن نعالجه نيابةً عنها.",
  sections: [
    {
      title: "1. ما نجمعه",
      body: [
        "بيانات الحساب: اسمك وبريدك الإلكتروني وكلمة مرورك (تُحفظ بصيغة مشفّرة باتجاه واحد فقط) ولغتك ومسمّاك الوظيفي.",
        "محتوى مساحة العمل: المشاريع والمهام والتعليقات والرسائل والملفات وبيانات العملاء التي تضيفها أنت وفريقك.",
        "بيانات الفوترة: الباقة والفواتير، وإيصال التحويل البنكي الذي ترفعه. وتذهب بيانات البطاقة مباشرةً إلى مزوّد الدفع ولا نراها ولا نخزّنها.",
        "بيانات الاستخدام والأمان: أوقات الدخول، والدولة المستنتجة من اتصالك (لا عنوان IP)، والصفحات التي تزورها في موقعنا عبر معرّف مجهول خاص بنا، وسجلات الأخطاء.",
      ],
    },
    {
      title: "2. لماذا نستخدمها",
      body: [
        "لتقديم الخدمة وميزاتها (ومنها رسائل الإشعارات التي يمكنك إيقافها من الإعدادات)، وحمايتها ومنع إساءة استخدامها، وفوترة الباقات المدفوعة، وتقديم الدعم، وفهم استخدام المنتج والموقع إجمالاً لتحسينهما.",
        "أسسنا النظامية: تنفيذ عقدنا معك أو مع وكالتك، ومصلحتنا المشروعة في خدمة آمنة ومتطورة، والامتثال للأنظمة (كحفظ الفواتير)، وموافقتك حيث تلزم.",
      ],
    },
    {
      title: "3. مع من نشاركها",
      body: [
        "مزوّدو الخدمات الذين يستضيفون الخدمة ويشغّلونها نيابةً عنا بموجب عقود تحمي البيانات: الاستضافة السحابية وقاعدة البيانات وتخزين الملفات وإرسال البريد، ومزوّد الدفع للباقات المدفوعة.",
        "داخل مساحة العمل، يحدد مديرو الوكالة ما يراه الآخرون (فالعملاء مثلاً لا يرون إلا ما يُشارك معهم).",
        "لا نبيع البيانات الشخصية ولا نستخدمها للإعلان. ولا نفصح عنها للجهات الرسمية إلا إذا أوجب النظام ذلك.",
      ],
    },
    {
      title: "4. أين تُخزَّن وإلى متى",
      body: [
        "قد تُعالج البيانات خارج بلدك لدى مزوّدي الاستضافة مع ضمانات مناسبة.",
        "يُحفظ محتوى مساحة العمل ما دامت قائمة ويُزال عند حذفها. وتُحفظ التسجيلات غير المكتملة حتى 180 يوماً (دون كلمة المرور)، والإشعارات المقروءة 90 يوماً، وإحصاءات الموقع نحو 13 شهراً، والفواتير المدة التي تتطلبها الأنظمة الضريبية.",
      ],
    },
    {
      title: "5. الأمان",
      body: [
        "كلمات المرور مشفّرة، والاتصالات مشفّرة، والملفات مخزّنة بشكل خاص ولا تُعرض إلا بعد التحقق من الصلاحية، ومساحات العمل معزولة عن بعضها، ويتطلب دخول الموظفين إلى مركز التحكم خطوتين للتحقق.",
      ],
    },
    {
      title: "6. حقوقك",
      body: [
        "يمكنك عرض ملفك وتصحيحه من الإعدادات، وتغيير كلمة المرور، وإيقاف رسائل الإشعارات، وحذف حسابك. ويمكن لمديري الوكالة تصدير بيانات مساحة العمل أو حذفها.",
        "ويمكنك أن تطلب منا الوصول إلى بياناتك أو تصحيحها أو حذفها أو نقلها أو الاعتراض على استخدامها بمراسلتنا على {email}. وإن كنت عضواً في مساحة عمل وكالة فقد نحيل طلبك إليها. ويحق لك تقديم شكوى إلى الجهة المختصة بحماية البيانات في بلدك.",
      ],
    },
    {
      title: "7. ملفات تعريف الارتباط",
      body: ["نستخدم الملفات الضرورية فقط: جلسة الدخول، ولغتك، وآخر مساحة عمل استخدمتها، ومعرّفاً مجهولاً لإحصاءات التسجيل الخاصة بنا. ولا نستخدم ملفات إعلانية أو تتبعية من أطراف ثالثة."],
    },
    {
      title: "8. التعديلات والتواصل",
      body: ["ننشر التعديلات هنا ونُعلم مديري مساحات العمل بالجوهري منها. للأسئلة أو الطلبات: {email}."],
    },
  ],
};

export const LEGAL = {
  terms: { en: termsEn, ar: termsAr },
  privacy: { en: privacyEn, ar: privacyAr },
} as const;
