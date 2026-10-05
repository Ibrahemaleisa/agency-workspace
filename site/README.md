# Operra — marketing website

The public website for Operra: landing page, product overview, features, solutions by agency type,
pricing, interactive demo, about, contact, log in and start-free-trial.

It is a **separate Next.js app** that lives in this repository next to the product, so it can use
real product screenshots and stay in sync with what the product does. It is deployed as its **own
Vercel project** and never ships inside a customer workspace.

## Run locally

```bash
cd site
npm install
npm run dev          # http://localhost:3001
```

Before pushing: `npx tsc --noEmit && npx eslint src && npm run build`.

## Deploy (Vercel)

1. Vercel → Add New → Project → import this repository.
2. **Root Directory: `site`**. Framework: Next.js (detected).
3. Environment variables — see `.env.example`. In production configure at least one delivery
   channel for the forms (`INQUIRY_TO` + `RESEND_API_KEY` or SMTP, and/or `INQUIRY_WEBHOOK_URL`);
   without one, the forms show an error instead of silently dropping requests.
4. `NEXT_PUBLIC_APP_URL` — the Operra app (platform mode, e.g. `https://app.operra.com`). With it,
   "Start free trial" goes to the app's self-serve sign-up, the demo to its read-only `/preview` and
   "Log in" to its sign-in, all in the visitor's language. Without it, the site falls back to the trial
   request form and the legacy demo (`NEXT_PUBLIC_DEMO_URL`).
5. `vercel.json` skips builds when nothing under `site/` changed.

The customer workspaces (repo root) ignore this folder: `site` is excluded from the root
`tsconfig.json` and ESLint config.

## Where things live

```
src/app/[lang]/          every page, once, for both languages (all statically prerendered)
src/proxy.ts             English at / (rewritten to /en), Arabic at /ar; /en/* redirects to /*
src/i18n/                locales, getContent() (next/root-params), client LocaleProvider
src/app/                 sitemap.ts (both languages + hreflang), robots.ts, opengraph-image.tsx
src/app/actions.ts       server actions for the trial and contact forms (zod validation, spam guard)
src/lib/site.ts          site name, tagline / descriptor (EN + AR), URLs, legacy demo, contact email
src/lib/app-links.ts     trial / demo / sign-in links into the Operra app
src/lib/deliver.ts       form delivery: Resend / SMTP / webhook
src/content/en/          ALL English copy: pages, UI strings, workflow, features, solutions, pricing + FAQ, nav
src/content/ar/          the same modules in Arabic, typed against the English ones (shapes can't drift)
src/content/shots.ts     screenshot registry: English and Arabic capture + alt text per shot
src/components/          UI building blocks (ProductFrame, WorkflowTour, FeatureRow, forms, header…)
src/assets/product/      real product screenshots (ar/: the product in Arabic, for /ar)
scripts/                 screenshot capture + compression
```

Copy changes are content edits in `src/content/{en,ar}/` — components don't hold marketing text.
Change both languages together; TypeScript fails the build if the Arabic shape differs.

### Rules for copy

- Describe only what the product does today. Every feature claim maps to shipped behaviour.
- No invented numbers, customer logos, testimonials or statistics.
- **Pricing:** `src/content/en/pricing.ts` has `price: null` and `trialDays: null` until they are
  agreed; the page then says "Priced per agency". Set real values there and nowhere else (Arabic reads them).
- Arabic is written for Arabic readers, using the product's own Arabic terms (مدير، موظف، عميل، وحدة…).
  Starter template stage and field names are English in the product, so they stay English on /ar.

## Brand

The site follows Operra's **Cadence · Kashida** identity; the full rules are in `../BRAND.md`.

- **Tokens:** `src/app/globals.css` (`@theme`). Token names are kept from the previous system:
  paper = bone `#F7F7F4`, ink = graphite `#15171C`, panel and signal = lapis `#1F3FBF`, plus
  `client` = amber `#E9A81A`, used only for work waiting on the client.
- **Logo:** `src/components/logo.tsx` (the stage-bar mark, mirrored in Arabic, plus the `operra` /
  `أوبيـــرّا` wordmarks). Also `src/app/icon.svg` and `opengraph-image.tsx`.
- **Type:** Alexandria for Arabic and Latin (SIL OFL), self-hosted from `src/fonts/`. No monospace;
  labels are sentence case. Headlines have no full stop; the tagline is the only exception.
- **Signature graphics:** the kashida stroke under the hero headline (the one load animation), the
  call sheet (`src/components/call-sheet.tsx`, copy in `content/*/home.ts` → `CALL_SHEET`) and
  stage bars in `Schematic`.
- **Roles:** `src/content/roles.ts` maps the brand's audiences (Buyer, Champion, Daily users,
  Guests) to the product's roles (Admin, Team member, Client).

### Where the site departs from the brand book (on purpose)

The brand messaging describes the full product vision. The site only claims what ships today, so:
the hero subline says "from brief to client sign‑off" (not "to invoice"); retainers, invoices,
margin, ⌘K, SAR pricing, version history, customer stories and a changelog are not mentioned.
Update the copy in `src/content/` as those ship. The Arabic site (`/ar`) is not built yet.

## Updating screenshots

Screenshots come from the product running the **demo data** locally ("Northwind Studio").
Never point this at a customer's workspace.

```bash
# repo root: product with demo data (wipes the LOCAL database)
npm run demo && npm run build && npm start               # http://localhost:3000

# site/
npx playwright install chromium   # once
npm i --no-save playwright        # once, or use a global install
node scripts/capture-screenshots.mjs                 # English set
SHOT_LANG=ar node scripts/capture-screenshots.mjs    # Arabic set → src/assets/product/ar/
node scripts/compress-screenshots.mjs
```

If a screen's layout changes, adjust the crop rectangles in `capture-screenshots.mjs` and check
`src/content/shots.ts` alt text still describes the image.
