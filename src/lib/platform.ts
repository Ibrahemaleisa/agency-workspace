/**
 * The public demo deployment (SHOW_DEMO_ACCOUNTS=true). Visitors try the system in a private copy
 * of the sample agency (lib/demo-sandbox.ts), and sign-in details stay read-only there.
 */
export const isSharedDemo = () => process.env.SHOW_DEMO_ACCOUNTS === "true";

/** Public base URL of the app (links in emails). */
export function appUrl() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}
