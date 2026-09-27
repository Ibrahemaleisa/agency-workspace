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
- **No commercially licensed fonts.** Only open-source fonts (currently DM Sans, IBM Plex Sans
  Arabic, and — for Operra's own screens and the marketing site — Instrument Sans and IBM Plex Mono). Fada's Thmanyah font is licensed to Fada only and must never be added here.
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
| Operra platform (production) | `operra` (team fada-team, `prj_XS23mKnRjhM495bF8OxymXG6p7bQ`) | operra-eight.vercel.app (operra.com is **not owned** — its DNS points to someone else's CloudFront; the operra.com entries on the project do nothing) | Neon `neon-coffee-feather` (Vercel Marketplace, connected to `operra` only) |
| Operra marketing site | `operra-site` (team fada-team, `prj_3saJesxjb81s4uAlvfgF3wpRfGKr`, Root Directory `site`) | operra-site.vercel.app (English `/`, Arabic `/ar`) | none |

The `operra` project has previews disabled, Vercel login only on previews, a private Blob store
(`operra-uploads`) and Production-only `OPERRA_PLATFORM`, `APP_SECRET`, `CRON_SECRET`, `SEED_PREVIEW`, `APP_URL`,
`MARKETING_URL`, `PLATFORM_ADMIN_*` (build creates the staff account; remove after first sign-in).
Neither project is Git-connected: production deploys are made from the API/dashboard for a chosen branch or commit.
Note: `workspace-demo`'s `DATABASE_URL` also targets **Preview**, so any branch preview build migrates the demo DB —
which is why `claude/**` branches are excluded from deployments in `vercel.json`.

Demo env vars: `DATABASE_URL`, `SEED_DEMO=true` (loads "Northwind Studio" sample data on the first
build of an empty DB), `SHOW_DEMO_ACCOUNTS=true`. Demo logins use the password `password`
(admin `sara@northwind.agency`). No email configured on the demo.

New customers: see README → "Add a new customer". Recommended: a separate Neon project per customer.

## Operra platform mode

`OPERRA_PLATFORM=true` turns this repo into the multi-tenant Operra SaaS (sign-up, provisioning, billing,
invitations, tours, `/preview`, control center at `/operra`). It must run on its **own** Vercel project and
database — never on a single-agency customer's. Everything about it: `DEPLOYMENT.md`.
Without the flag, single-agency deployments behave exactly as before (billing, sign-up and preview are off).

- Isolation check (read-only): `npm run verify:isolation`.
- Preview tenant (safe, only touches slug `demo`): `npm run db:seed-preview`.
- Free trial: **14 days** (confirmed by the owner, 27 Sep 2026). Live value per plan in `plans.trial_days`,
  edited in the control center → Plans; code default `DEFAULT_TRIAL_DAYS` in `src/lib/billing/defaults.ts`.
- **Plans agreed by the owner (27 Sep 2026):** Standard 299 (up to 10 team members, 10 clients) and Full package 499
  (unlimited), SAR per month (currency/interval assumed — editable in the control center → Plans). Seeded by migration 0013;
  the old `workspace` plan is hidden. Limits are enforced in `src/lib/limits.ts` (invites, new users, re-activation, clients).
  Flow: sign-up (or sign-in after the trial) → choose plan → payment → invoice (table `invoices`, emailed to admins) →
  workspace opens (tutorial for new customers, congratulations for returning ones). Plan badge under the logo:
  trial white, Standard grey, Full gold.
- **Selling without a payment gateway (current mode):** "Subscribe" creates a plan request (`plan_requests`); the
  workspace opens at once (3-day grace if the trial had ended). Staff activate it in the control center (home page
  "Waiting for activation", or the customer page) for 1–12 months → subscription `provider = manual`, invoice recorded
  and emailed, congratulations shown once; it locks again at its paid-until date (renew from the customer page).
  `src/lib/billing/manual.ts`. Connecting a gateway later switches Subscribe to online checkout automatically.
- Support: control center → People → person → "Create password reset link" (24 h, one use) for when email isn't set up.
- **Next (owner):** a per-workspace Settings section — to be planned with the owner.
- Control center analytics (`src/lib/analytics.ts`, table `platform_events`): site page views (beacon from `site/` to
  `/api/t`, anonymous `operra_vid` visitor id carried into sign-up as `?vid=`), sign-up steps shown/completed,
  workspace creation, sign-ins/failed attempts, daily activity; `accounts.last_login_at/login_count`,
  `users.last_seen_at`. Pages: `/operra/signups` (funnel + who didn't finish) and `/operra/people` (+ timeline).
  No raw IPs; abandoned sign-ups kept 180 days without password; events pruned after ~13 months (cron).
- Customer workspaces are hosted by Operra (path `/w/{slug}` on the app host, or `{slug}.<root domain>` once a
  real domain is set). Customers can't set a custom domain or touch the backend; only staff can (control center).
- People vs agencies: `accounts` = a person (email, password, verified email); `users` = their **membership** in one
  agency (role, client link). One person can belong to several agencies and switch between them; sessions and
  every tenant query work on a membership.

## Marketing website (`site/`)

The Operra marketing site is a **separate Next.js app in `site/`**, deployed as its own Vercel project
(Root Directory `site`). It is excluded from the product's `tsconfig.json` and ESLint, so customer
workspaces never build or ship it. English at `/`, Arabic at `/ar` (`app/[lang]`); copy lives in
`site/src/content/en` and `site/src/content/ar` (same shapes). `NEXT_PUBLIC_APP_URL` points its calls to
action at the platform's sign-up, preview and sign-in; screenshots are real captures of
the demo data (`site/scripts/capture-screenshots.mjs`). Pricing numbers are deliberately unset
(`site/src/content/pricing.ts`) until agreed. See `site/README.md`.

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

## Working locally

```bash
docker compose up -d            # or any local Postgres; set DATABASE_URL in .env
npm install
npm run db:migrate && npm run dev          # empty → setup screen
npm run demo                               # optional: demo data (wipes the DB)
npx tsc --noEmit && npx eslint src && npm run build   # before every push
```
