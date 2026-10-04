# Agency Workspace — white-label edition

A bilingual (Arabic / English) project-management platform for creative and marketing agencies:
clients, projects, reusable modules, tasks, client approvals, project and team chat, email + in-app
notifications, keyword search, dashboards and a public landing page with a lead form.

This edition carries **no built-in brand**. Each customer agency sets its own name, logo, colours,
default language and public page from **Settings → Brand**, and everything — sidebar, sign-in,
landing page, browser icon, emails, guide — follows it.

## How white-labelling works

**One repository, one deployment per customer.**

```
            this GitHub repo
                   │  (push once → every customer updates)
     ┌─────────────┼─────────────┐
 Vercel project  Vercel project  Vercel project
 + database A    + database B    + database C
 (Agency A)      (Agency B)      (Agency C)
```

- Every customer has its **own Vercel project and its own Postgres database**, so their data is fully
  separate.
- All projects deploy from **this same repo**. Fix a bug or add a feature once, push to `main`, and
  every customer gets it.
- Branding lives in each customer's database (Settings → Brand), not in the code.

## Add a new customer (about 10 minutes)

1. **Vercel → Add New → Project** → import this repo. Give the project the customer's name
   (e.g. `acme-workspace`). Keep the defaults.
2. In the project's **Storage** tab, create a **Neon** Postgres database and connect it
   (this sets `DATABASE_URL`).
3. **Setup code (required)**: in Settings → Environment Variables add `SETUP_TOKEN` (sensitive) —
   any long random text. Until the first admin exists, `/setup` asks for it, so nobody else can
   claim the new workspace by opening the URL first. Without it, production shows a reminder instead.
4. Optional but recommended — **email**: in Settings → Environment Variables add
   `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (sensitive) and `EMAIL_FROM`
   (see `.env.example`). Without them, notifications are in-app only and "Forgot password?"
   tells people to ask their admin.
5. **Deploy** (or Redeploy). Production builds run the database migrations; the database starts empty.
6. Open the site. It shows **Set up your workspace**: enter the setup code, the agency's name and the
   first admin account. You land on **Settings → Brand** to upload the logo and pick colours.
7. Optional: add the customer's domain in the project's **Domains** tab
   (e.g. `app.acme.com`) and set `APP_URL` to it so links in emails use it.

Hand the admin login to the customer. They add their team and clients from **Team & Users**.

**Migrations only run on Production deployments** (`scripts/vercel-build.sh`). Preview builds of
other branches never touch the customer's database. Because a push to `main` migrates every customer
at once, keep migrations additive (new tables/columns), and let CI pass before merging.

## Brand settings (per customer, no code)

| Setting | Where it shows |
|---|---|
| Name (English + Arabic) | Sidebar, sign-in, landing page, page titles, emails, guide |
| Logo (PNG / JPG / WebP / SVG, ≤ 300 KB) | Sidebar, sign-in, landing page, browser tab icon |
| Primary colour (dark) | Sidebar, buttons, landing page background, email header |
| Accent colour (light) | Badges, active menu item, highlights, email button text |
| Default language | First visit, until the visitor uses the AR / EN switch |
| Landing page on/off | Off → visitors go straight to sign-in |
| Contact email, WhatsApp, social links, showcase clients | Landing page |

Pick a **dark primary** and a **light accent** so text stays readable. The full palette is derived
from these two colours at runtime (`src/lib/brand.ts`).

## Run locally

```bash
docker compose up -d              # Postgres on localhost:5432 (or use your own)
cp .env.example .env
npm install
npm run db:migrate                # empty database → first-run setup screen
npm run dev                       # http://localhost:3000
```

Want sample data to explore? `npm run demo` loads a demo agency ("Northwind Studio") with
projects, tasks and users — every demo account uses the password `password`.
**Never run the demo seed against a customer's database: it wipes it.** As a safety net the seed
refuses to run on any database that holds a workspace other than the demo (unless `ALLOW_DB_RESET=true`).

Checks (the same ones CI runs on every push and pull request):

```bash
npm run typecheck && npx eslint src tests
npm run demo && npm test          # access-control tests need the demo data
npm run build
```

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | Postgres connection string (Neon on Vercel) |
| `SETUP_TOKEN` | yes, until set up | Code required on the first-run setup screen |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | for email | Any SMTP server, e.g. Google Workspace with an App Password |
| `RESEND_API_KEY` | alternative to SMTP | Send through Resend instead |
| `EMAIL_FROM` | for email | Sender, e.g. `Acme <no-reply@acme.com>` |
| `APP_URL` | recommended | Public URL used in email links (auto-detected on Vercel) |
| `BLOB_READ_WRITE_TOKEN` | optional | Store uploads in Vercel Blob instead of the database |
| `SHOW_DEMO_ACCOUNTS` | optional | `true` lists demo logins on the sign-in page (demo sites only) |
| `SEED_DEMO` | optional | `true` loads the demo agency on the first build of an **empty** database (demo sites only) |
| `SITE_ORG_SLUG` | optional | Which workspace receives landing-page requests (defaults to the first one) |

## Fonts

English uses **DM Sans** and Arabic uses **IBM Plex Sans Arabic** — both open-source (SIL OFL), so
the edition can be redistributed to any customer. Don't add a commercially licensed font here unless
its licence covers every customer deployment.

## How it's organized

```
src/
  app/(public)/          landing (/welcome), sign-in, forgot/reset password, first-run setup
  app/(app)/             the workspace (dashboard, projects, tasks, chat, settings/brand, guide…)
  lib/brand.ts           brand settings + colour theming
  lib/permissions.ts     central role → permission policy
  lib/scope.ts           which projects/tasks each user may see (SQL) · lib/access.ts loads one or 404s
  lib/rate-limit.ts      sign-in / reset / contact-form throttling (stored in Postgres)
  lib/i18n.ts, i18n-app.ts   Arabic + English copy ("{brand}" is replaced with the agency name)
  server/                server actions
  db/schema.ts           database schema (Drizzle) · drizzle/ migrations
  content/guide.ts       built-in user guide
tests/                   access-control tests (npm test)
scripts/vercel-build.sh  Vercel build: migrations on Production only
```

Stack: Next.js 16 · React 19 · Tailwind CSS 4 · Drizzle ORM · PostgreSQL.
