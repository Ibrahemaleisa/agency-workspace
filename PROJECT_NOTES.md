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
- **No commercially licensed fonts.** Only open-source fonts (currently DM Sans + IBM Plex Sans
  Arabic). Fada's Thmanyah font is licensed to Fada only and must never be added here.
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

Demo env vars: `DATABASE_URL`, `SEED_DEMO=true` (loads "Northwind Studio" sample data on the first
build of an empty DB), `SHOW_DEMO_ACCOUNTS=true`. Demo logins use the password `password`
(admin `sara@northwind.agency`). No email configured on the demo.

New customers: see README → "Add a new customer". Recommended: a separate Neon project per customer.

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
