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
- **No prices are published** until the owner agrees them (plans.price_cents stays null; site pricing stays unset).
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
