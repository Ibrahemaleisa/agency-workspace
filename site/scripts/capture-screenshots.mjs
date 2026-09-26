/**
 * Re-captures the product screenshots used on the marketing site.
 *
 * Run the PRODUCT (repo root) locally with the demo data first — never against a customer database:
 *   (repo root)  npm run demo && npm run build && npm start        # http://localhost:3000
 * Then:
 *   (site/)      node scripts/capture-screenshots.mjs               # needs Playwright: npx playwright install chromium
 *
 * Output: src/assets/product/*.png (2x). Run `node scripts/compress-screenshots.mjs` afterwards.
 * Records are found by name, so this works on any fresh demo seed.
 */
import { chromium } from "playwright";

const BASE = process.env.PRODUCT_URL ?? "http://localhost:3000";
const OUT = new URL("../src/assets/product/", import.meta.url).pathname;
const DESKTOP = { width: 1440, height: 900 };
const PHONE = { width: 390, height: 844 };
// Area to the right of the product sidebar, for cropped shots.
const CONTENT_X = 280;
const CONTENT_W = 1136;

async function signIn(browser, email, { lang = "en", viewport = DESKTOP } = {}) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/lang?to=${lang}&next=/login`);
  await page.fill("input[name=email]", email);
  await page.fill("input[name=password]", "password");
  await Promise.all([page.waitForURL((u) => !u.pathname.startsWith("/login")), page.click("button[type=submit]")]);
  return page;
}

async function open(page, path) {
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
}

async function hrefOf(page, listPath, selector, text) {
  await open(page, listPath);
  const href = await page.locator(selector, { hasText: text }).first().getAttribute("href");
  if (!href) throw new Error(`No link "${text}" on ${listPath}`);
  return href.split("?")[0];
}

const shot = (page, name, clip) => page.screenshot({ path: `${OUT}${name}.png`, ...(clip ? { clip } : {}) });

async function card(page, title, name) {
  await page
    .locator("section")
    .filter({ has: page.locator("h2", { hasText: title }) })
    .first()
    .screenshot({ path: `${OUT}${name}.png` });
}

const browser = await chromium.launch();
try {
  const admin = await signIn(browser, "sara@northwind.agency");
  const project = await hrefOf(admin, "/projects", 'a[href^="/projects/"]', "Autumn Menu Launch");
  const approvalTask = await hrefOf(admin, `${project}?tab=tasks&view=list`, 'a[href^="/tasks/"]', "Paid Media: Client Approval");
  const heroTask = await hrefOf(admin, `${project}?tab=tasks&view=list`, 'a[href^="/tasks/"]', "Hero photo selects");

  await open(admin, "/");
  await shot(admin, "dashboard");
  await card(admin, "Project health matrix", "crop-matrix");
  await card(admin, "Team workload", "crop-workload");
  await shot(admin, "crop-stats", { x: CONTENT_X, y: 170, width: 1140, height: 145 });
  await open(admin, "/clients");
  await shot(admin, "clients");
  await open(admin, project);
  await shot(admin, "project-overview");
  await shot(admin, "crop-module-stages", { x: CONTENT_X, y: 358, width: CONTENT_W, height: 168 });
  await open(admin, `${project}?tab=tasks`);
  await shot(admin, "project-board");
  await open(admin, `${project}?tab=activity`);
  await shot(admin, "project-activity");
  await open(admin, `${project}?tab=chat&channel=internal`);
  await shot(admin, "crop-chat", { x: CONTENT_X, y: 360, width: CONTENT_W, height: 540 });
  await open(admin, "/templates");
  await shot(admin, "templates");
  await shot(admin, "crop-template", { x: CONTENT_X, y: 190, width: 563, height: 480 });
  await open(admin, approvalTask);
  await shot(admin, "task-request-approval");
  await shot(admin, "crop-request-approval", { x: 276, y: 190, width: 762, height: 212 });

  const adminAr = await signIn(browser, "sara@northwind.agency", { lang: "ar" });
  await open(adminAr, "/");
  await shot(adminAr, "dashboard-ar");

  const phone = await signIn(browser, "sara@northwind.agency", { viewport: PHONE });
  await open(phone, "/");
  await shot(phone, "mobile-dashboard");
  await open(phone, project);
  await shot(phone, "mobile-project");

  const employee = await signIn(browser, "omar@northwind.agency");
  await open(employee, "/");
  await shot(employee, "employee-dashboard");

  const client = await signIn(browser, "lina@bloomcafe.com");
  await open(client, "/");
  await shot(client, "client-dashboard");
  await open(client, "/approvals");
  await shot(client, "client-approvals");
  await open(client, heroTask);
  await shot(client, "client-task");
  await shot(client, "crop-client-approve", { x: 276, y: 190, width: 762, height: 222 });

  console.log(`Screenshots written to ${OUT}`);
} finally {
  await browser.close();
}
