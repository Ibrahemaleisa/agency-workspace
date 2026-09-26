/**
 * Pricing. Commercial terms are set here and nowhere else.
 *
 * `price` and `trialDays` are intentionally `null` until the business confirms them —
 * the page then shows "priced per agency" copy instead of a number. Never publish a
 * number here that hasn't been agreed.
 */
export const PRICING: {
  plan: string;
  blurb: string;
  price: null | { amount: string; period: string; note?: string };
  trialDays: number | null;
  included: string[];
} = {
  plan: "Operra Workspace",
  blurb: "No feature tiers and no add-ons to unlock approvals or the client portal. Every workspace gets the whole product.",
  price: null,
  trialDays: null,
  included: [
    "Dedicated workspace and database for your agency",
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
    a: "We set up a dedicated workspace for your agency with its own database, and email you the admin sign-in. You set your brand in Settings → Brand, then add your team and clients.",
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
    a: "In your own Postgres database, used by your workspace only. Other agencies’ workspaces run on separate deployments and databases.",
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
    a: "Yes. Your workspace carries your name, logo and colours, and can run on your own domain such as app.youragency.com.",
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
