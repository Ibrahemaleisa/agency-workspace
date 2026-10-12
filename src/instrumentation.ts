import type { Instrumentation } from "next";

/*
 * Server error reporting. Every unexpected error is logged as one JSON line (searchable in the
 * hosting provider's logs); with ALERT_WEBHOOK_URL set, it is also posted to that webhook — a Slack,
 * Discord, Google Chat or Microsoft Teams incoming webhook, or any endpoint taking {"text": "..."}.
 * Never sent: request headers, cookies, query strings or form contents.
 */

// Errors that are part of normal operation (redirects, 404s, refused writes), not faults.
const EXPECTED = /^(NEXT_REDIRECT|NEXT_NOT_FOUND|NEXT_HTTP_ERROR_FALLBACK|DYNAMIC_SERVER_USAGE)|READ_ONLY_PREVIEW|WORKSPACE_LOCKED|You do not have permission|destination stream closed early/;

// At most one alert per error per 10 minutes from each server instance.
const recent = new Map<string, number>();
const QUIET_MS = 10 * 60_000;

export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  const message = err instanceof Error ? err.message : String(err);
  const digest = typeof err === "object" && err !== null && "digest" in err ? String((err as { digest: unknown }).digest) : undefined;
  if (EXPECTED.test(message) || (digest && EXPECTED.test(digest))) return;

  const path = request.path.split("?")[0];
  const entry = {
    level: "error",
    at: new Date().toISOString(),
    message: message.slice(0, 500),
    digest,
    method: request.method,
    path,
    route: context.routePath,
    type: context.routeType,
    stack: err instanceof Error ? err.stack?.split("\n").slice(0, 8).join("\n") : undefined,
  };
  console.error(JSON.stringify(entry));

  const url = process.env.ALERT_WEBHOOK_URL;
  if (!url) return;
  const key = `${context.routePath}:${message.slice(0, 120)}`;
  const last = recent.get(key) ?? 0;
  if (Date.now() - last < QUIET_MS) return;
  recent.set(key, Date.now());
  if (recent.size > 500) recent.clear();
  const where = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.APP_URL ?? "app";
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `⚠️ Server error on ${where}\n${request.method} ${path} (${context.routeType} · ${context.routePath})\n${entry.message}${digest ? `\ndigest ${digest}` : ""}`,
      }),
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // Reporting must never fail the request.
  }
};
