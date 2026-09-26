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

Design tokens are in `src/app/globals.css` (`@theme`). The palette matches the product's default
theme (ink `#0b0b0c` + sand `#e8dcc8`) so screenshots sit naturally on the page. The logo is an
inline SVG in `src/components/logo.tsx`, mirrored in `src/app/icon.svg` and
`src/app/opengraph-image.tsx`. Type is DM Sans (SIL OFL, self-hosted via `next/font/local`).

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
