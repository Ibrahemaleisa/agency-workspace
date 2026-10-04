import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

/**
 * First-run setup is protected by a SETUP_TOKEN environment variable, so whoever happens to
 * open a fresh deployment first can't claim it. In development the token is optional.
 * - "token":   SETUP_TOKEN is set — the setup form asks for it.
 * - "missing": production without SETUP_TOKEN — setup is closed until one is added.
 * - "open":    local development without a token.
 */
export function setupMode(): "token" | "missing" | "open" {
  if (process.env.SETUP_TOKEN) return "token";
  return process.env.NODE_ENV === "production" ? "missing" : "open";
}

export function setupTokenMatches(input: string | null) {
  const expected = process.env.SETUP_TOKEN;
  if (!expected || !input) return false;
  // Compare digests so lengths match and timing reveals nothing.
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}
