# Deploying Operra

This repository runs in two modes. Pick one per deployment.

| | **Platform mode** (`OPERRA_PLATFORM=true`) | **Single-agency mode** (default) |
|---|---|---|
| What it is | The multi-tenant Operra SaaS: agencies sign up, get a provisioned workspace, subscribe | One agency per deployment and database (the original white-label edition) |
| Tenants | Many, isolated by `org_id` on every row and every query | One |
| Onboarding | `/signup` → company → brand → provisioning → workspace | `/setup` first-run screen |
| Billing | Stripe (or the labelled test provider) | None in the app |
| Demo | `/preview` (read-only sample tenant) | Demo accounts on `/login` (`SHOW_DEMO_ACCOUNTS`) |
| Control center | `/operra` on the app host | — |

The marketing site (`site/`) is a separate Next.js app and a separate Vercel project — see `site/README.md`.

> **Never** run `npm run demo` / `db:seed` against a database with real data — it wipes it.
> `npm run db:seed-preview` is the safe one: it only ever touches the `demo` tenant.

---

## 1. Platform mode on Vercel

### Database

Create a Postgres database (Neon recommended) used **only** by the platform. Every build runs
`drizzle-kit migrate`, so the schema is created on the first deploy.

### Vercel project

- Framework: Next.js · Root directory: repository root · Build command: default (`vercel-build`).
- Add the environment variables below (mark secrets as **Sensitive**).
- `vercel.json` schedules `/api/cron/cleanup` daily; set `CRON_SECRET` or the job is refused.

### Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | Postgres connection string (`POSTGRES_URL` also accepted). |
| `OPERRA_PLATFORM` | yes | `true` turns on platform mode. |
| `APP_URL` | yes | Public URL of the app, e.g. `https://app.operra.com`. Sign-up, preview, control center and email links use it. |
| `APP_SECRET` | yes | 32+ random characters. Signs short-lived tokens (test checkout). Required in production. `openssl rand -base64 48` |
| `APP_ROOT_DOMAIN` | recommended | e.g. `operra.com` → tenants live at `{slug}.operra.com`. Without it, tenants use path routing: `APP_URL/w/{slug}`. |
| `CRON_SECRET` | yes | Vercel sends it to `/api/cron/cleanup`. |
| `SEED_PREVIEW` | recommended | `true` creates the read-only `demo` tenant for `/preview` on build (non-destructive, idempotent). |
| `MARKETING_URL` | optional | Where the Operra logo on sign-up / preview pages links, e.g. `https://operra.com`. |
| `BILLING_PROVIDER` | optional | `stripe` or `test`. Defaults to Stripe when `STRIPE_SECRET_KEY` is set, otherwise none. |
| `STRIPE_SECRET_KEY` | for billing | Stripe secret key. |
| `STRIPE_WEBHOOK_SECRET` | for billing | Signing secret of the webhook endpoint (see below). |
| `STRIPE_PRICE_WORKSPACE` | for billing | Stripe Price ID for the `workspace` plan (`STRIPE_PRICE_<PLAN CODE>` per plan). |
| `ALLOW_TEST_BILLING` | never in real production | `true` allows `BILLING_PROVIDER=test` on a production build (staging only). The test provider shows a **TEST MODE** page and never charges. |
| `BLOB_READ_WRITE_TOKEN` | recommended | Vercel Blob for uploads (larger files). Without it, uploads on Vercel are stored in Postgres (4 MB limit). |
| `RESEND_API_KEY` **or** `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS` | recommended | Email for invitations and notifications. Without email, invitations show a copyable link instead. |
| `EMAIL_FROM` | with email | Sender, e.g. `"Operra <no-reply@operra.com>"`. |

No credential is ever committed; `.env.example` lists them all with placeholders.

### Tenant URLs and DNS

- **Subdomains** (`APP_ROOT_DOMAIN=operra.com`): add the wildcard domain `*.operra.com` to the Vercel project
  (Vercel issues the wildcard certificate; the domain's nameservers must be Vercel's for wildcards). Also add
  `app.operra.com` (= `APP_URL`). A request to `acme.operra.com` resolves the tenant `acme`; a session from any
  other tenant is rejected on that host. Signing in on `APP_URL` hands the user to their tenant's subdomain with a
  single-use, 2-minute token.
- **Path routing** (no `APP_ROOT_DOMAIN`): `APP_URL/w/acme` brands the sign-in page for `acme`. The hint is only
  branding; data access always follows the signed-in user's tenant.
- **Custom domains**: set `organizations.custom_domain` for the tenant (control center shows it; setting it is a
  manual, verified step), add the domain to the Vercel project and have the customer point a CNAME at Vercel.
  The app then serves that tenant on it, and email links use it.

Reserved slugs (`app`, `www`, `api`, `admin`, `operra`, `demo`, …) can never be taken by an agency.

### Stripe

1. Create a Product with a recurring Price; put its ID in `STRIPE_PRICE_WORKSPACE`.
2. Add a webhook endpoint `https://app.operra.com/api/billing/webhook` for
   `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated` and
   `customer.subscription.deleted` (failed renewals arrive as a subscription status of `past_due` / `unpaid`).
3. Put its signing secret in `STRIPE_WEBHOOK_SECRET`.

Signatures are verified (HMAC, 5-minute tolerance) and every event is applied once (`billing_events` is unique
on provider + event id), so Stripe's retries are safe. Subscription state lives in `subscriptions`; the app never
marks a payment successful on its own.

### Plans and trial length

Plans live in the `plans` table. The migration creates one: `workspace` / "Operra Workspace" with
**`trial_days = 14` and no price** — confirm the trial length before launch and change it with SQL
(`UPDATE plans SET trial_days = … WHERE code = 'workspace'`). `price_cents` is display-only (Stripe charges the
Price). When a trial ends without a subscription, the workspace pauses (nothing is deleted); admins can still
reach Billing.

### Operra staff (control center)

```bash
PLATFORM_ADMIN_PASSWORD='a long passphrase' DATABASE_URL=… npm run platform:admin -- you@operra.com "Your Name"
```

Sign in at `APP_URL/operra`. It exists only on the app host (404 on tenant hosts), uses its own session cookie,
and is separate from every tenant's admins. Staff can search tenants by serial (`OPR-000123`), pause / restore a
tenant (pausing ends its sessions) and extend trials; each action is written to the server log with the staff member's email.

### After the first deploy — checklist

1. `GET /api/health` → `{"ok":true,"db":"up"}`.
2. `/preview` shows three roles (needs `SEED_PREVIEW=true`).
3. Create an agency through `/signup`; it gets serial `OPR-00000N` and opens its guided tour.
4. `npm run verify:isolation` against the database (read-only checks) → "All isolation checks passed."
5. Create a staff account and open `/operra`.

---

## 2. Single-agency mode (existing customer deployments)

Unchanged. Leave `OPERRA_PLATFORM` unset. See README → "Add a new customer". Billing, sign-up, preview and the
control center are all switched off; `/setup` creates the first admin on an empty database.

---

## 3. Local development

```bash
docker compose up -d                          # or any Postgres
cp .env.example .env                          # set DATABASE_URL, and for platform mode:
#   OPERRA_PLATFORM=true  APP_URL=http://localhost:3000  APP_SECRET=dev-secret-dev-secret-dev-secret
#   BILLING_PROVIDER=test                     # labelled test checkout, no Stripe needed
npm install
npm run db:migrate
npm run db:seed-preview                       # the /preview tenant (safe)
npm run dev
```

Subdomains locally: `APP_ROOT_DOMAIN=localhost` and open `http://{slug}.localhost:3000` (Chrome and Firefox
resolve `*.localhost`).

Before every push: `npx tsc --noEmit && npx eslint src && npm run build` (and in `site/`, the same).

---

## 4. Security notes

- **Tenant isolation**: every tenant-owned table carries `org_id`; queries go through `projectScope` /
  `taskScope` / `orgId` filters derived from the signed-in user, never from request input.
  `npm run verify:isolation` asserts it against real data.
- **Sessions** are bound to a tenant: on a tenant host, a session of another tenant is refused.
  Cookies are `httpOnly`, `sameSite=lax`, `secure` in production; tokens are stored hashed.
- **Rate limits** (Postgres, shared by all instances): sign-in (per IP and per email), sign-up, invitation
  accept, invitations per tenant, preview, control-center sign-in.
- **Preview** sessions are read-only: every server action refuses to write for them.
- **Headers**: `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS.
- **Uploads**: logos are PNG/JPEG/WebP/SVG ≤ 300 KB, rendered only as images; attachments are served after an
  access check, with `nosniff`, and only raster images inline.
- **Known limits**: an email address belongs to one workspace (a person can't join two agencies with the same
  email); sign-up doesn't verify email ownership yet (add it once email is configured); `x-forwarded-host` is
  trusted for tenant resolution — correct on Vercel; behind your own proxy, make sure it overwrites that header.
