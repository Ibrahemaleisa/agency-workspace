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
4. `vercel.json` skips builds when nothing under `site/` changed.

The customer workspaces (repo root) ignore this folder: `site` is excluded from the root
`tsconfig.json` and ESLint config.

## Where things live

```
src/app/                 routes (all statically prerendered), sitemap.ts, robots.ts, opengraph-image.tsx
src/app/actions.ts       server actions for the trial and contact forms (zod validation, spam guard)
src/lib/site.ts          site name, URLs, demo workspace + demo sign-ins, contact email
src/lib/deliver.ts       form delivery: Resend / SMTP / webhook
src/content/             ALL copy: workflow steps, features, solutions, pricing + FAQ, navigation
src/content/shots.ts     screenshot registry with alt text
src/components/          UI building blocks (ProductFrame, WorkflowTour, FeatureRow, forms, header…)
src/assets/product/      real product screenshots
scripts/                 screenshot capture + compression
```

Copy changes are content edits in `src/content/` — components don't hold marketing text.

### Rules for copy

- Describe only what the product does today. Every feature claim maps to shipped behaviour.
- No invented numbers, customer logos, testimonials or statistics.
- **Pricing:** `src/content/pricing.ts` has `price: null` and `trialDays: null` until they are
  agreed; the page then says "Priced per agency". Set real values there and nowhere else.

## Brand

The site follows the **Operra Brand & Identity System** ("Instrument" direction):
https://claude.ai/artifact/7gPd78PFVXXN8aY5VwwVrF

- **Tokens** — `src/app/globals.css` (`@theme`) mirrors the brand system's `tokens.json`: paper
  `#F6F6F3`, surface, ink `#0B0D10`, panel `#121519`, text-muted, line / line-strong, and signal
  `#FF5A1F`. The 90 / 8 / 2 rule applies: signal marks what is live (the logo dot, a live status
  dot) and never decorates. Semantic colours (success, warning, danger, info) are product-only;
  the site uses danger for form errors and info for the focus ring.
- **Logo** — `src/components/logo.tsx` holds the constructed wordmark and the Live O copied from the
  brand system (never re-typeset "Operra"). Also in `src/app/icon.svg` and `opengraph-image.tsx`.
- **Type** — Instrument Sans (display + UI), IBM Plex Mono (labels, data), IBM Plex Sans Arabic —
  all SIL OFL, self-hosted from `src/fonts/`. Headlines are sentence case with no full stop; the
  tagline is the only exception.
- **Shape and motion** — radius 4 / 8 / 12 / 20px, hairlines instead of shadows, 1.5px square-cap
  icons. Motion only means a state changed: the only animation is the live dot's pulse.
- **Schematics, not illustration** — `Schematic` and `StatusDot` draw how work moves from status
  dots and hairlines.
- **Roles** — `src/content/roles.ts` maps the brand's audiences (Buyer, Champion, Daily users,
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
node scripts/capture-screenshots.mjs
node scripts/compress-screenshots.mjs
```

If a screen's layout changes, adjust the crop rectangles in `capture-screenshots.mjs` and check
`src/content/shots.ts` alt text still describes the image.
