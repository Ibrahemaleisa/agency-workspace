import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * APP_SECRET signs short-lived, tamper-proof payloads (e.g. test-checkout links).
 * Required in production; development falls back to a fixed value with a warning.
 */
function secret() {
  const s = process.env.APP_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === "production") throw new Error("APP_SECRET must be set (32+ characters) in production.");
  return "development-only-secret-do-not-use-in-production";
}

export function sign(payload: object, ttlSeconds: number) {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + ttlSeconds * 1000 })).toString("base64url");
  const mac = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${mac}`;
}

export function verify<T>(token: string): T | null {
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const expected = createHmac("sha256", secret()).update(body).digest();
  const given = Buffer.from(mac, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString()) as T & { exp: number };
    return data.exp > Date.now() ? data : null;
  } catch {
    return null;
  }
}
