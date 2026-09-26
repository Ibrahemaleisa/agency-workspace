import "server-only";
import { headers } from "next/headers";

/** Best-effort client IP (behind Vercel / a proxy). Only used for rate limiting. */
export async function clientIp() {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();
}

/** A same-site path from untrusted input, or "/". Rejects "//host", "/\host" and control characters. */
export function safePath(next: string | null | undefined) {
  if (!next || !next.startsWith("/") || next.startsWith("//") || /[\\\u0000-\u001f]/.test(next)) return "/";
  return next;
}

/**
 * Redirect to a path on the host the request arrived on. A relative Location keeps a visitor on
 * their tenant's subdomain or custom domain; building an absolute URL from `request.url` may not.
 */
export function redirectTo(path: string) {
  return new Response(null, { status: 307, headers: { Location: path } });
}
