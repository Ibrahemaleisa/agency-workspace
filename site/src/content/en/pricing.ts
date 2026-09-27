/**
 * Pricing. Commercial terms are set here and nowhere else.
 *
 * `price` and `trialDays` are intentionally `null` until the business confirms them —
 * the page then shows "priced per agency" copy instead of a number. Never publish a
 * number here that hasn't been agreed.
 */
export type Pricing = {
  plan: string;
  blurb: string;
  price: null | { amount: string; period: string; note?: string };
  trialDays: number | null;
  included: string[];
};

export const PRICING: Pricing = {
  plan: "Operra Workspace",
  blurb: "No feature tiers and no add-ons to unlock approvals or the client portal. Every workspace gets the whole product.",
  price: null,
  trialDays: null,
  included: [
    "Your own workspace, with its data kept apart",
    "Your name, logo, colours and domain",
    "Clients, projects, modules and tasks",
    "Reusable module templates with custom fields",
    "Client portal and client approvals",
    "Project chat (team + client) and team chat",
    "In-app and email notifications",
    "Role dashboards and project health matrix",
    "Activity log, search and task views",
    "Public page with a lead form",
    "Arabic and English, with right-to-left layout",
    "Admin, team member and client roles",
  ],
};

export type Faq = { q: string; a: string };

export const PRICING_FAQ: Faq[] = [
  {
    q: "What happens when I start a trial?",
    a: "You create your workspace yourself: your account, your agency’s name and address, then your logo and colours. It’s ready in seconds with starter templates and a guided tour, and you invite your team and clients from there.",
  },
  {
    q: "What happens when the trial ends?",
    a: "Your admin can subscribe from Billing inside the workspace at any time. If the trial ends first, the workspace pauses — nothing is deleted — until a subscription starts.",
  },
  {
    q: "Is every feature included?",
    a: "Yes. Operra has no feature tiers — approvals, the client portal, chat, dashboards and white-label branding are part of every workspace.",
  },
  {
    q: "Do clients need a paid seat to approve work?",
    a: "Clients sign in with a client account on your workspace. Talk to us about how client accounts are counted on your plan.",
  },
  {
    q: "Where is my data stored?",
    a: "In Operra’s Postgres database, where every record belongs to one workspace and every query is scoped to it. If you need a dedicated deployment and database, talk to us.",
  },
];

export const GENERAL_FAQ: Faq[] = [
  {
    q: "Can clients see our internal comments or chat?",
    a: "No. Clients only see tasks, files and comments your team shares with them, and the client channel of their project. Internal notes, internal comments and team chat are never shown.",
  },
  {
    q: "Can we change the workflows?",
    a: "Yes. Edit the starter templates or create your own in Module Templates: write stages one per line, end a stage with * to make it a client approval, and add fields such as text, number, date, link or select.",
  },
  {
    q: "Does it work in Arabic?",
    a: "The whole interface switches between Arabic and English, with a right-to-left layout in Arabic. Each person’s notification emails follow the language they use.",
  },
  {
    q: "Can we use our own domain and brand?",
    a: "Yes. Your workspace carries your name, logo and colours from the moment you create it, and can run on your own domain such as app.youragency.com.",
  },
  {
    q: "Does it send email?",
    a: "Yes, once a sending account is connected — your own SMTP (for example Google Workspace) or Resend. Until then, notifications appear in the app only.",
  },
  {
    q: "How large can uploads be?",
    a: "Up to 4 MB per upload on the standard setup. This can be raised by connecting Vercel Blob storage.",
  },
];
