# Deploying Operra

This repository is two things:

| | What | Vercel project | Root directory |
|---|---|---|---|
| **App** | The workspace. `OPERRA_PLATFORM=true` → the multi-tenant Operra SaaS. Unset → a single-agency white-label deployment (existing customers). | one per deployment | repository root |
| **Marketing site** | operra.com, English at `/`, Arabic at `/ar` (`site/`). | its own | `site` |

> **Before merging to `main`:** every push to `main` redeploys **every** project connected to this repo, and each
> app build runs `drizzle-kit migrate` on its own database. Migrations 0007–0010 (platform tables, accounts ↔
> memberships, password resets, two indexes) are additive and keep all data — every existing user becomes an
> account with the same password — but **take a backup or a Neon branch of each customer database first.**
>
> Work branches named `claude/**` never deploy (`git.deploymentEnabled` in both `vercel.json` files), so pushing
> them can't run migrations against a connected project's database. `main` deploys as usual.
>
> **Never** run `npm run demo` / `db:seed` against a database with real data — it wipes it.
> `npm run db:seed-preview` is safe: it only ever touches the `demo` tenant.

Contents: [Local](#1-local-development) · [Preview / staging](#2-preview--staging) · [Production](#3-production) ·
[Environment variables](#4-environment-variables) · [Verification checklist](#5-production-verification-checklist) ·
[Operations](#6-operations) · [Security notes](#7-security-notes)

---

## 1. Local development

Requirements: Node 20+, Postgres 15+ (Docker is fine).

```bash
docker compose up -d                              # or any local Postgres
cp .env.example .env
# In .env:
#   DATABASE_URL=postgres://…/agency
#   OPERRA_PLATFORM=true
#   APP_URL=http://localhost:3000
#   APP_SECRET=<any 32+ characters>
#   BILLING_PROVIDER=test                          # labelled fake checkout, no Stripe needed
npm install
npm run db:migrate                                # creates every table, the "workspace" plan (14-day trial)
npm run db:seed-preview                           # the read-only /preview tenant (safe)
PLATFORM_ADMIN_PASSWORD='a long passphrase' npm run platform:admin -- you@example.com "Your Name"
npm run dev                                       # http://localhost:3000/signup · /preview · /operra
```

- **Subdomains locally:** add `APP_ROOT_DOMAIN=localhost` and open `http://{slug}.localhost:3000`.
- **Email locally:** leave email unset (invitations show a copy link; verification / reset say email isn't set
  up), or point `SMTP_HOST`/`SMTP_PORT` at a local SMTP catcher (e.g. Mailpit) to see real messages.
- **Single-agency mode locally:** leave `OPERRA_PLATFORM` unset; `npm run demo` loads Northwind Studio (wipes the DB).
- **Marketing site:** `cd site && npm install && NEXT_PUBLIC_APP_URL=http://localhost:3000 npm run dev` (port 3001).

Before every push (both apps):

```bash
npx tsc --noEmit && npx eslint src scripts && npm run build
npm run verify:isolation                          # read-only tenant-isolation assertions
(cd site && npx tsc --noEmit && npx eslint src && npm run build)
```

---

## 2. Preview / staging

Use a **separate** Vercel project and database — never a customer's, never production's.

1. Vercel → Add New → Project → import the repository, root directory = repository root.
2. Database: a Neon **branch** of production (realistic data volume) or a new Neon project. Put its URL in
   `DATABASE_URL` for the staging project only.
3. Environment variables: as production (section 4), with these differences:
   - `APP_URL` = the staging URL; `APP_ROOT_DOMAIN` unset (path routing) unless you have a staging wildcard domain.
   - Billing: Stripe **test-mode** keys (`sk_test_…`, a test webhook, a test Price) — or `BILLING_PROVIDER=test`
     with `ALLOW_TEST_BILLING=true` to use the labelled fake checkout. **Never set `ALLOW_TEST_BILLING` in production.**
   - `SEED_PREVIEW=true`.
4. Vercel preview deployments of pull requests use the **Preview** environment's variables — scope the staging
   values to "Preview" so a PR never talks to the production database.

---

## 3. Production

### 3.1 Vercel project (app)

1. Vercel → Add New → Project → import `ibrahemaleisa/agency-workspace`.
2. Root directory: repository root. Framework: Next.js. Build command: leave default (runs `vercel-build`:
   migrate → optional seeds → `next build`). Node 20+.
3. Add the environment variables in section 4 (mark every secret **Sensitive**).
4. `vercel.json` schedules `GET /api/cron/cleanup` daily at 03:17 UTC. It needs `CRON_SECRET`; without it the job
   is refused (no trial expiry recording, no token cleanup).

### 3.2 Production database

1. Create a **new Neon project** used only by the platform (region close to your users; not `neondb` of
   agency-pm, not a customer's).
2. Create a dedicated role for the app (not the owner role) and use its pooled connection string as
   `DATABASE_URL`.
3. The first deploy runs every migration. To run them by hand: `DATABASE_URL=… npm run db:migrate`.
4. **Backups:** Neon provides point-in-time restore; the retention window depends on your Neon plan — check and
   set it in the Neon project settings. Before risky changes (and before merging migrations), create a branch.
   Operra has no separate backup job; for off-platform copies schedule `pg_dump` yourself.

### 3.3 Domains

| Host | Points to | Purpose |
|---|---|---|
| `operra.com`, `www.operra.com` | marketing-site project | Marketing site (`/` English, `/ar` Arabic) |
| `app.operra.com` | app project | Sign-up, sign-in, `/preview`, `/operra` control center — this is `APP_URL` |
| `*.operra.com` | app project | Each agency at `{slug}.operra.com` — set `APP_ROOT_DOMAIN=operra.com` |
| `app.customer.com` (optional) | app project | A customer's own domain (below) |

**Wildcard DNS:** Vercel issues wildcard certificates only when the domain uses Vercel's nameservers. Either move
`operra.com`'s nameservers to Vercel, or delegate a subdomain zone. Then add both `app.operra.com` and
`*.operra.com` to the app project. Slugs such as `app`, `www`, `api`, `admin`, `operra`, `demo`, `mail`, `docs`
are reserved and can never become an agency.

**Without wildcard DNS** leave `APP_ROOT_DOMAIN` unset: agencies then live at `app.operra.com/w/{slug}`
(everything works; the address is just less pretty).

**Custom domains (per agency):** set `organizations.custom_domain` for that tenant (a manual, verified step —
SQL for now), add the domain to the app project, and have the customer add the CNAME Vercel shows. The workspace
and its email links then use that domain.

### 3.4 Stripe

1. Stripe Dashboard → Products → create "Operra Workspace" with a recurring Price. Copy the Price ID (`price_…`).
2. Put it on the plan: control center → **Plans** → Stripe price ID (or env `STRIPE_PRICE_WORKSPACE`).
3. Developers → API keys → secret key → `STRIPE_SECRET_KEY` (`sk_live_…`).
4. Settings → Billing → Customer portal: enable it (payment method, invoices, cancel) — the Billing page links to it.

**Webhook:** Developers → Webhooks → Add endpoint `https://app.operra.com/api/billing/webhook` with events
`checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`,
`customer.subscription.deleted`. Copy its signing secret → `STRIPE_WEBHOOK_SECRET`.
Signatures are verified (5-minute tolerance) and each event applies once (`billing_events` is unique on
provider + event id), so Stripe's retries are safe. Failed renewals arrive as `past_due` / `unpaid`.

Subscribing during a free trial keeps the remaining days (Stripe `trial_end`; Stripe requires at least 48 hours
left, otherwise billing starts at once).

### 3.5 Plans, trial and prices

- Plans live in the `plans` table and are edited in the control center (**Plans**): name, **free trial (days)**,
  display price (blank = not published), currency, interval, Stripe price ID, available for sign-up.
- Default plan `workspace`: **14-day trial, no published price.** The code default is `DEFAULT_TRIAL_DAYS` in
  `src/lib/billing/defaults.ts` (used only when a plan row is created or missing).
- A trial starts when provisioning completes (`subscriptions.trial_ends_at`). When it ends without a
  subscription the workspace locks immediately (pages, server actions and file downloads), nothing is deleted,
  admins can still reach Billing, and the daily job records the status as `expired`.

### 3.6 Demo

- **Platform demo:** `https://app.operra.com/preview` — read-only sessions into the sample tenant `demo`
  (Northwind Studio). Created on build when `SEED_PREVIEW=true` (idempotent; `--reset` recreates it).
- **Legacy shared demo** (`workspace-demo` project) stays as it is for single-agency sales.

### 3.7 Marketing site

1. Vercel → Add New → Project → same repository, **root directory `site`**.
2. Variables: `NEXT_PUBLIC_SITE_URL=https://operra.com`, `NEXT_PUBLIC_APP_URL=https://app.operra.com`,
   `NEXT_PUBLIC_CONTACT_EMAIL` (optional), and a form delivery channel (`INQUIRY_TO` + `RESEND_API_KEY` or SMTP,
   and/or `INQUIRY_WEBHOOK_URL`). See `site/.env.example`.
3. Domains: `operra.com` and `www.operra.com`. `site/vercel.json` skips builds when nothing under `site/` changed.

### 3.8 First deploy, step by step

1. Create the database (3.2) and the app project (3.1) with all production variables (section 4).
2. Deploy. The build migrates the database and (with `SEED_PREVIEW=true`) creates the demo tenant.
3. Create a staff account (from your machine, against the production database):
   `PLATFORM_ADMIN_PASSWORD='…' DATABASE_URL='…' npm run platform:admin -- you@operra.com "Your Name"`
4. Add the domains (3.3) and wait for certificates.
5. Configure Stripe and the webhook (3.4); set the plan's Stripe price ID in the control center.
6. Deploy the marketing site (3.7).
7. Run the checklist (section 5).

---

## 4. Environment variables

### App — production

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | **yes** | Postgres (pooled). `POSTGRES_URL` is also accepted. |
| `OPERRA_PLATFORM` | **yes** | `true`. |
| `APP_URL` | **yes** | `https://app.operra.com`. Used for sign-up, preview, control center and email links. |
| `APP_SECRET` | **yes** | 32+ random characters (`openssl rand -base64 48`). Signs the agency chooser and test-checkout tokens. The app refuses to sign without it in production. |
| `CRON_SECRET` | **yes** | Random string; Vercel Cron sends it to `/api/cron/cleanup`. |
| `APP_ROOT_DOMAIN` | recommended | `operra.com` → agencies at `{slug}.operra.com` (needs wildcard DNS). |
| `SEED_PREVIEW` | recommended | `true` → create the `/preview` demo tenant on build. |
| `MARKETING_URL` | recommended | `https://operra.com` (where the Operra logo on sign-up / preview links). |
| `STRIPE_SECRET_KEY` | for payments | `sk_live_…`. With it, the provider defaults to Stripe. |
| `STRIPE_WEBHOOK_SECRET` | for payments | `whsec_…` of the webhook endpoint. |
| `STRIPE_PRICE_WORKSPACE` | optional | Fallback when the plan has no Stripe price ID in the control center. |
| `BILLING_PROVIDER` | optional | `stripe` (default when a key is set) or `test`. |
| `ALLOW_TEST_BILLING` | **never in production** | Staging only: lets `BILLING_PROVIDER=test` run on a production build. |
| `RESEND_API_KEY` **or** `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | strongly recommended | Invitations, email verification, password reset, notifications. Without it: invitations show a copy link, verification and reset emails can't be sent (nothing is faked). |
| `EMAIL_FROM` | with email | e.g. `Operra <no-reply@operra.com>` (a sender your provider has verified). |
| `BLOB_READ_WRITE_TOKEN` | recommended | Vercel Blob (private) for uploads. Without it uploads go to Postgres (4 MB per file on Vercel). |

Not needed in platform mode: `SEED_DEMO`, `SHOW_DEMO_ACCOUNTS`, `SITE_ORG_SLUG` (single-agency only).
Local only: `UPLOAD_DIR`, `FILE_STORAGE`, `PLATFORM_ADMIN_PASSWORD` (read by `npm run platform:admin`).

After deploying, the control center shows a **Configuration** panel listing which of these are set (names only).

### Single-agency (existing customers)

Unchanged: `DATABASE_URL`, optional email variables, `APP_URL`, `BLOB_READ_WRITE_TOKEN`; demo projects also
`SEED_DEMO`, `SHOW_DEMO_ACCOUNTS`. See README → "Add a new customer".

---

## 5. Production verification checklist

Run after the first deploy and after any infrastructure change.

- [ ] `GET https://app.operra.com/api/health` → `{"ok":true,"db":"up"}`.
- [ ] Control center (`/operra`) → **Configuration**: no red rows. Every row you expect to be configured is green.
- [ ] `https://operra.com` and `/ar` load; "Start free trial" opens `app.operra.com/signup` in the same language.
- [ ] `/preview` shows three roles; entering as Client shows the preview banner; pressing Approve is refused.
- [ ] Sign up a test agency: company → brand → provisioning shows a serial `OPR-00000N` → the workspace opens at
      `{slug}.operra.com` (or `/w/{slug}`) with the admin tour; Billing shows **Free trial · 14 days left**.
- [ ] The verification email arrives; its link confirms the address (Notifications page shows "Confirmed").
- [ ] "Forgot your password?" sends a reset link; resetting signs you out everywhere.
- [ ] Invite a team member and a client; both emails arrive; each joins and gets their role's tour.
- [ ] Subscribe with a real card (then refund) — the webhook turns the status **Active**; Stripe → Webhooks shows
      2xx responses.
- [ ] `npm run verify:isolation` against production (read-only) → "All isolation checks passed."
- [ ] Tomorrow: Vercel → Cron Jobs shows `/api/cron/cleanup` succeeded.
- [ ] Pause the test agency from the control center (there is no delete; remove it with SQL if needed).

---

## 6. Operations

- **Logs:** Vercel → project → Logs. Useful tags: `[control-center]` (staff actions, with the staff email),
  `[cron] cleanup`, `[checkout failed]`, `[stripe webhook]`, `[invite email failed]`,
  `[verification email failed]`, `[password reset email failed]`, `[email skipped …]`.
- **Staff accounts:** `npm run platform:admin -- <email> <name>` creates or resets one (password from
  `PLATFORM_ADMIN_PASSWORD`, 12+ characters).
- **Pausing an agency:** control center → customer → Pause (ends its sessions). Restore the same way.
- **Extending a trial:** control center → customer → Extend trial (free trials only).
- **Changing the trial length or publishing a price:** control center → Plans.
- **Tenant isolation check:** `DATABASE_URL=… npm run verify:isolation` (read-only).
- **Rotating secrets:** changing `APP_SECRET` only invalidates in-flight chooser / test-checkout tokens.
  Rotating `STRIPE_WEBHOOK_SECRET` must happen together with the Stripe endpoint's secret.

---

## 7. Security notes

- **People and agencies:** an `accounts` row is a person (one email, one password, email-verified status); each
  `users` row is that person's membership in one agency (role, client link). Sessions belong to a membership,
  and every tenant query is scoped by the membership's agency. A person in two agencies has two memberships and
  switches between them; the target membership is always checked against their own account.
- **Tenant hosts:** on `{slug}.operra.com` or a custom domain, only that agency's memberships can sign in and a
  session from another agency is refused. `x-forwarded-host` is trusted for this — correct on Vercel; behind your
  own proxy make sure it overwrites that header.
- **Passwords:** bcrypt. An agency admin can set a password only for someone whose sole workspace is theirs;
  people in several agencies reset their own (emailed, 1-hour, single-use link; signs them out everywhere).
  Reset links are built from configured hosts only (never the request's Host header).
- **Tokens** (sessions, invitations, handoff, verification, reset) are random, stored hashed, expire, and are
  single-use where it matters. Invitations can't set an existing account's password — the person confirms with
  their own.
- **Rate limits** (Postgres-backed, shared by all instances): sign-in (per IP and per email), sign-up, invitation
  accept, invitations per agency, preview, verification, password reset, control-center sign-in.
- **Locked workspaces** (paused, or trial ended) can't change anything: pages show a gate, server actions and
  file downloads are refused; billing stays reachable for admins.
- **Preview** sessions are read-only at the single choke point (`requireUser`).
- **Control center:** its own staff accounts and cookie (path `/operra`, `SameSite=Strict`), only on the app host.
- **Headers:** `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS; no CORS headers
  (nothing is meant to be called cross-origin; Stripe's webhook is server-to-server).
- **Uploads:** size-limited, stored under random keys (private Blob), served only after an access check, with
  `nosniff`; only raster images display inline. Logos: PNG / JPEG / WebP / SVG ≤ 300 KB, only ever rendered as images.
