# Project notes (read first)

Context for anyone — human or AI assistant — continuing work on this repository.

## What this is

The **white-label edition** of the Fada agency workspace: a bilingual (Arabic / English)
project-management platform that any agency can brand from **Settings → Brand**. It was forked
from Fada's own workspace (`Ibrahemaleisa/agency-pm`) on 24 Sep 2026 with all Fada branding removed.

The owner is **Fada** (Ibrahem Aleisa), who resells this edition to other agencies.
Talk to the owner in **English** (they write in Arabic or English); the product itself is Arabic-first.

## Hard rules

- **Never touch Fada's own project.** Do not modify, push to, deploy or change settings of:
  the GitHub repo `Ibrahemaleisa/agency-pm`, the Vercel project `agency-pm`
  (`agency-pm-gilt.vercel.app`), or its Neon database `neondb`. All work happens here.
- **No commercially licensed fonts.** Only open-source fonts (currently DM Sans and IBM Plex Sans
  Arabic). Fada's Thmanyah font is licensed to Fada only and must never be added here.
  Design skill for this repo: `.claude/skills/frontend-design`.
- **No Fada branding** in code, copy, seed data or defaults. Brand text uses the `{brand}`
  placeholder (see `lib/brand.ts` → `withBrand`).
- **Never run the demo seed (`npm run demo` / `db:seed`) against a customer's database** — it wipes it.
- Never commit secrets. Credentials live only in Vercel environment variables (sensitive).

## How deployment works

One repo → one Vercel project + one Postgres database **per customer** (fully separate data).
Every push to `main` redeploys all customer projects connected to this repo.

| Deployment | Vercel project | URL | Database |
|---|---|---|---|
| Demo for buyers | `workspace-demo` (team fada-team) | workspace-demo-sooty.vercel.app | Neon DB `workspace_demo` with its own restricted login `workspace_demo_app` |

Note: `workspace-demo`'s `DATABASE_URL` also targets **Preview**, so any branch preview build migrates the demo DB —
which is why `claude/**` branches are excluded from deployments in `vercel.json`.

Demo env vars: `DATABASE_URL`, `SEED_DEMO=true` (loads "Northwind Studio" sample data on the first
build of an empty DB), `SHOW_DEMO_ACCOUNTS=true`. The Northwind logins still use the password `password`
(admin `sara@northwind.agency`) but are no longer listed. No email configured on the demo.

**The public demo (29 Oct 2026, owner's direction):** the link we send to prospects. With
`SHOW_DEMO_ACCOUNTS=true` (`isSharedDemo()` in `lib/platform.ts`):
- `/` for visitors is a product landing page (`components/demo/landing.tsx`, copy in `lib/i18n-demo.ts`):
  the visitor types an agency name and picks colours — the whole page and a workspace preview re-tint
  live — then enters as admin, team member or client. No sign-up, no password.
- Each entry creates a **private copy** of the Northwind sample agency in that name and colours
  (`lib/demo-sandbox.ts`: organizations with `is_demo = true` and a `try-` slug, people with `.invalid`
  addresses). Only that visitor sees their changes. A bar inside lets them switch role, open Brand
  settings, or end the demo. Signing out / "End demo" deletes the copy; copies also expire after 8 hours
  (pruned when a new one starts and by the daily cleanup cron). Max 300 at once, 20 starts per IP per hour.
- Passwords, emails, roles and account status stay read-only there.

**Nightly demo reset:** `vercel.json` schedules `/api/cron/reset-demo` daily at 03:00 UTC for every project,
but it only acts where `DEMO_RESET=true`, `SEED_DEMO=true` and `SHOW_DEMO_ACCOUNTS=true` are all set
and `CRON_SECRET` matches; everywhere else it returns 404. Set
`DEMO_RESET` and `CRON_SECRET` on `workspace-demo` only — **never on a customer**.

New customers: see README → "Add a new customer". Recommended: a separate Neon project per customer.

## Operra removed (29 Oct 2026)

The owner cancelled Operra (the multi-tenant SaaS, its marketing site and its identity). Removed from the
code: `site/`, sign-up/provisioning, billing (Lemon Squeezy, Stripe, manual plans, limits), the control
center (`/operra`), `/preview`, analytics, subdomain/custom-domain tenancy, `DEPLOYMENT.md`, `BRAND.md`.
Its tables (plans, subscriptions, invoices, signups, platform_* …) are **left in the schema** with no
migration, so existing databases keep working; they are unused. The Vercel projects `operra` and
`operra-site` and their Neon database were not touched — pause or delete them from the dashboard if wanted.
Git history has the full Operra code (last commit before removal: `ac99aec`).

## Added 12 Oct 2026 (full-product pass)

- **Data lifecycle:** delete projects / clients (typed confirmation), templates, leads; remove people from a
  workspace; edit/delete own comments, delete own chat messages (admins: any); JSON export
  (`/api/export`); delete my account. `src/lib/lifecycle.ts`.
- **Work tracking:** task checklists, time entries, repeating tasks (`src/lib/recurrence.ts`), Reports page with
  CSV (`/reports`, `/api/reports/*`, permission `reports.view`), private iCalendar feed (`/api/calendar/{secret}`).
- **Security:** nonce CSP in `proxy.ts`; `src/instrumentation.ts` error alerts (`ALERT_WEBHOOK_URL`).
- Direct browser → Blob uploads (`components/direct-upload.tsx`) point at `/api/uploads`, a route that does not
  exist in the repo (it was already missing before the Operra removal) — needs adding before relying on it.
- **Legal:** `/terms`, `/privacy` (`src/content/legal.ts`, filled from `LEGAL_*` env) — a starting text that
  **must be reviewed by a lawyer** before relying on it.
- **Lists are paged** (tasks, notifications, leads, chat history); old notifications are pruned by the cron.
- **Tests:** `npm test` (`tests/unit.test.ts`, `tests/db.test.ts`); CI also runs the isolation check and a
  schema-vs-migrations drift check.
- `vercel.json` must keep the two crons and the `claude/**` deploy exclusion (an edit on 12 Oct had removed them).

## Added 13 Oct 2026

- **Sign-in is email + password only, in one place** (`/login`); old `/w/{slug}` links just open `/login`.
- **Template library by agency function** (`src/lib/template-library.ts`): 18 workflows (strategy, social media,
  copywriting, graphic design, video & motion, photography, branding, paid ads, media buying, SEO, influencer,
  community management, PR, web, email & CRM, events, analytics & reporting, account management), each in
  English and Arabic. Templates → Library adds one or all, in the chosen language (`module_templates.source_key`,
  migration 0021). New workspaces start with 6 (`STARTER_TEMPLATES`) in their default language. The demo seed
  still uses `lib/default-templates.ts` (its sample projects refer to those names).

## Architecture in one minute

- Next.js 16 (App Router, `proxy.ts`, server actions) · React 19 · Tailwind CSS 4 · Drizzle ORM · Postgres.
  Read `node_modules/next/dist/docs/` before using Next APIs (see AGENTS.md).
- `lib/brand.ts` — reads the agency's brand from the `organizations` row (single-tenant per
  deployment) and derives the whole palette from a primary + accent colour (`brandCss`).
- `app/(public)/setup` — first-run screen; only works while the database has no users.
- `app/(app)/settings/brand` — brand settings (admin, permission `brand.manage`).
- `lib/permissions.ts` (roles → permissions), `lib/access.ts` (row scoping).
- `lib/events.ts` → `notify()` stores bilingual notifications and emails them (`lib/email.ts`,
  SMTP or Resend) in each user's language, after the response.
- Copy: `lib/i18n.ts` (public site), `lib/i18n-app.ts` (app), `content/guide.ts` (built-in guide).
- Migrations in `drizzle/` (`npm run db:generate`, `npm run db:migrate`).
- Approval tasks: staff choosing "Completed" sends the task to the client instead; only admins
  (`approvals.override`) can complete it without the client or remove the approval requirement.
- Clients' project progress and counts only include tasks shared with them.
- Logos are stored as data URLs but served from `/brand-logo/{orgId}?v=<hash>`; pages never inline them.
- CI (`.github/workflows/ci.yml`) runs migrations, lint, typecheck, tests, the isolation check and the build.

## Working locally

```bash
docker compose up -d            # or any local Postgres; set DATABASE_URL in .env
npm install
npm run db:migrate && npm run dev          # empty → setup screen
npm run demo                               # optional: demo data (wipes the DB)
npx next typegen && npx tsc --noEmit && npx eslint src && npm run build   # before every push
```
