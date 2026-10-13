/**
 * Unit tests for the rules the product depends on (no database needed).
 *   npm test   (runs these and, with DATABASE_URL set, tests/db.test.ts)
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { base32Decode, base32Encode, totpCode, verifyTotp, newTotpSecret } from "../src/lib/totp";
import { can } from "../src/lib/permissions";
import { effectiveStatus, hasAccess } from "../src/lib/billing";
import { nextDueDate } from "../src/lib/recurrence";
import { toCsv } from "../src/lib/reports";
import { safePath } from "../src/lib/request";
import { resolveMentions } from "../src/lib/events";
import { verifyStripeSignature } from "../src/lib/billing/stripe";
import { normalizeLemonSqueezyEvent, verifyLemonSqueezySignature } from "../src/lib/billing/lemonsqueezy";
import { sign, verify } from "../src/lib/secret";
import { activityText } from "../src/lib/activity-text";
import { APP_DICT } from "../src/lib/i18n-app";
import { formatMinutes, hoursOf } from "../src/lib/time";

describe("TOTP (authenticator codes)", () => {
  // RFC 6238 appendix B: SHA-1 secret "12345678901234567890", T = 59 s → 94287082 (8 digits).
  const secret = base32Encode(Buffer.from("12345678901234567890"));
  it("matches the RFC 6238 test vector", () => {
    assert.equal(secret, "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
    assert.equal(totpCode(secret, Math.floor(59 / 30)), "287082");
    assert.equal(totpCode(secret, Math.floor(1111111109 / 30)), "081804");
  });
  it("round-trips base32", () => {
    const s = newTotpSecret();
    assert.equal(base32Encode(base32Decode(s)), s);
  });
  it("accepts the current code once and refuses a replay", () => {
    const s = newTotpSecret();
    const now = Date.now();
    const step = Math.floor(now / 30_000);
    const code = totpCode(s, step);
    const used = verifyTotp(s, code, null, now);
    assert.equal(used, step);
    assert.equal(verifyTotp(s, code, used, now), null);
  });
  it("refuses wrong or malformed codes", () => {
    const s = newTotpSecret();
    assert.equal(verifyTotp(s, "12345"), null);
    assert.equal(verifyTotp(s, "abcdef"), null);
  });
});

describe("permissions", () => {
  it("clients can only comment, chat with the agency and decide approvals", () => {
    const client = { role: "client" as const };
    for (const p of ["comments.client", "chat.client", "approvals.decide"] as const) assert.ok(can(client, p), p);
    for (const p of ["tasks.edit", "tasks.updateStatus", "comments.internal", "files.upload", "chat.internal", "time.log", "reports.view", "users.manage"] as const)
      assert.ok(!can(client, p), p);
  });
  it("employees work on tasks but don't manage the workspace", () => {
    const e = { role: "employee" as const };
    for (const p of ["tasks.create", "tasks.edit", "time.log", "files.upload"] as const) assert.ok(can(e, p), p);
    for (const p of ["users.manage", "billing.manage", "approvals.override", "reports.view", "tasks.delete", "projects.manage"] as const) assert.ok(!can(e, p), p);
  });
  it("admins can do everything except see other roles' dashboards", () => {
    const a = { role: "admin" as const };
    for (const p of ["users.manage", "billing.manage", "reports.view", "approvals.override", "brand.manage"] as const) assert.ok(can(a, p), p);
    assert.ok(!can(a, "dashboard.client"));
    assert.ok(!can(null, "tasks.edit"));
  });
});

describe("subscription access", () => {
  const past = new Date(Date.now() - 86_400_000);
  const future = new Date(Date.now() + 86_400_000);
  it("an ended trial is expired at once, without waiting for the daily job", () => {
    assert.equal(effectiveStatus({ status: "trialing", trialEndsAt: past, providerSubscriptionId: null }), "expired");
    assert.equal(effectiveStatus({ status: "trialing", trialEndsAt: future, providerSubscriptionId: null }), "trialing");
  });
  it("a trial with a paid subscription behind it is left to the provider", () => {
    assert.equal(effectiveStatus({ status: "trialing", trialEndsAt: past, providerSubscriptionId: "sub_1" }), "trialing");
  });
  it("a manually activated plan locks at its paid-until date", () => {
    assert.equal(effectiveStatus({ status: "active", provider: "manual", currentPeriodEnd: past, trialEndsAt: null, providerSubscriptionId: null }), "expired");
    assert.equal(effectiveStatus({ status: "active", provider: "manual", currentPeriodEnd: future, trialEndsAt: null, providerSubscriptionId: null }), "active");
  });
  it("only applies on the platform, and never to the demo tenant", () => {
    const sub = { status: "canceled", trialEndsAt: null, providerSubscriptionId: null } as never;
    const before = process.env.OPERRA_PLATFORM;
    process.env.OPERRA_PLATFORM = "true";
    try {
      assert.equal(hasAccess({ isDemo: false }, sub), false);
      assert.equal(hasAccess({ isDemo: true }, sub), true);
      assert.equal(hasAccess({ isDemo: false }, { status: "past_due", trialEndsAt: null, providerSubscriptionId: "x" } as never), true);
    } finally {
      process.env.OPERRA_PLATFORM = before;
    }
    assert.equal(hasAccess({ isDemo: false }, sub), before === "true" ? false : true);
  });
});

describe("repeating tasks", () => {
  const today = new Date("2026-10-12T09:00:00Z");
  it("moves the due date on by one interval", () => {
    assert.equal(nextDueDate("2026-10-20", "daily", today), "2026-10-21");
    assert.equal(nextDueDate("2026-10-20", "weekly", today), "2026-10-27");
    assert.equal(nextDueDate("2026-10-20", "monthly", today), "2026-11-20");
  });
  it("never creates one that is already overdue", () => {
    assert.equal(nextDueDate("2026-09-01", "weekly", today), "2026-10-13");
    assert.equal(nextDueDate(null, "daily", today), "2026-10-13");
  });
});

describe("CSV", () => {
  it("adds a BOM, quotes and neutralises formulas", () => {
    const csv = toCsv([["a", 'b "q"', "x,y"], ["=SUM(A1)", "@x", "-1"], [null, 2, true]]);
    assert.ok(csv.startsWith("﻿"));
    assert.ok(csv.includes('"b ""q"""'));
    assert.ok(csv.includes('"x,y"'));
    assert.ok(csv.includes("'=SUM(A1)"));
    assert.ok(csv.includes("'@x"));
    assert.ok(csv.includes(",2,true"));
  });
});

describe("time", () => {
  it("formats minutes", () => {
    assert.equal(formatMinutes(95), "1:35");
    assert.equal(formatMinutes(5), "0:05");
    assert.equal(hoursOf(90), "1.5");
  });
});

describe("safe redirects", () => {
  it("keeps same-site paths and refuses others", () => {
    assert.equal(safePath("/tasks/1"), "/tasks/1");
    for (const bad of ["//evil.com", "/\\evil.com", "https://evil.com", "", null, "/a\u0000b"]) assert.equal(safePath(bad as string), "/");
  });
});

describe("mentions", () => {
  const people = [
    { id: "1", name: "Sara Haddad" },
    { id: "2", name: "Omar Khalil" },
    { id: "3", name: "سارة أحمد" },
  ];
  it("matches first names and full names, in Arabic too", () => {
    assert.deepEqual(resolveMentions("hi @sara and @omar.khalil", people).sort(), ["1", "2"]);
    assert.deepEqual(resolveMentions("مرحبا @سارة", people), ["3"]);
    assert.deepEqual(resolveMentions("no mention", people), []);
  });
});

describe("webhook signatures", () => {
  it("verifies Stripe signatures with a 5-minute window", () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    const body = '{"id":"evt_1"}';
    const t = Math.floor(Date.now() / 1000);
    const sig = createHmac("sha256", "whsec_test").update(`${t}.${body}`).digest("hex");
    assert.ok(verifyStripeSignature(body, `t=${t},v1=${sig}`));
    assert.ok(!verifyStripeSignature(body + " ", `t=${t},v1=${sig}`));
    const old = t - 600;
    const oldSig = createHmac("sha256", "whsec_test").update(`${old}.${body}`).digest("hex");
    assert.ok(!verifyStripeSignature(body, `t=${old},v1=${oldSig}`));
  });
  it("verifies Lemon Squeezy signatures", () => {
    process.env.LEMONSQUEEZY_WEBHOOK_SECRET = "ls_test";
    const body = '{"meta":{}}';
    const sig = createHmac("sha256", "ls_test").update(body).digest("hex");
    assert.ok(verifyLemonSqueezySignature(body, sig));
    assert.ok(!verifyLemonSqueezySignature(body, "0".repeat(64)));
    assert.ok(!verifyLemonSqueezySignature(body, null));
  });
  it("reads the plan a Lemon Squeezy subscription is on now (its variant)", () => {
    const evt = normalizeLemonSqueezyEvent({
      meta: { event_name: "subscription_updated", custom_data: { org_id: "o1", plan: "standard" } },
      data: { id: "77", type: "subscriptions", attributes: { status: "active", variant_id: 555, customer_id: 9, renews_at: null, ends_at: null, cancelled: false, updated_at: "2026-10-01T00:00:00Z" } },
    });
    assert.equal(evt?.planRef?.variantId, "555");
    assert.equal(evt?.planRef?.code, "standard");
    assert.equal(evt?.status, "active");
  });
});

describe("signed tokens", () => {
  it("rejects tampering and expiry", () => {
    const tok = sign({ a: 1 }, 60);
    assert.deepEqual(verify<{ a: number }>(tok)?.a, 1);
    const [body, mac] = tok.split(".");
    assert.equal(verify(`${body}x.${mac}`), null);
    assert.equal(verify(sign({ a: 1 }, -1)), null);
  });
});

describe("activity log text", () => {
  it("has both languages for the new actions", () => {
    for (const action of ["task.recurred", "time.logged", "project.deleted", "client.deleted", "user.removed"]) {
      const params = { title: "T", due: "2026-10-20", duration: "1:30", name: "N" };
      const en = activityText({ action, summary: "fallback", params }, "en", APP_DICT.en);
      const ar = activityText({ action, summary: "fallback", params }, "ar", APP_DICT.ar);
      assert.notEqual(en, "fallback", action);
      assert.notEqual(ar, "fallback", action);
    }
  });
});

describe("template library", async () => {
  const { TEMPLATE_LIBRARY, STARTER_TEMPLATES, libraryTemplate } = await import("../src/lib/template-library");
  const { MODULE_TONES } = await import("../src/lib/constants");
  it("has one complete, bilingual workflow per agency function", () => {
    assert.ok(TEMPLATE_LIBRARY.length >= 18);
    assert.equal(new Set(TEMPLATE_LIBRARY.map((t) => t.key)).size, TEMPLATE_LIBRARY.length, "unique keys");
    for (const t of TEMPLATE_LIBRARY) {
      assert.ok(t.name.en && t.name.ar && t.description.en && t.description.ar, t.key);
      assert.ok(t.stages.length >= 4 && t.stages.length <= 7, `${t.key}: 4–7 stages`);
      assert.ok(t.stages.some((s) => s.approval), `${t.key}: at least one client approval`);
      assert.ok((MODULE_TONES as string[]).includes(t.color), `${t.key}: module colour`);
      for (const s of t.stages) assert.ok(s.en && s.ar, `${t.key}: stage text`);
      for (const lang of ["en", "ar"] as const) {
        const names = t.stages.map((s) => s[lang]);
        assert.equal(new Set(names).size, names.length, `${t.key}: unique stage names (${lang})`);
      }
      for (const f of t.fields) {
        assert.match(f.key, /^[A-Za-z][A-Za-z0-9_]{0,62}$/, `${t.key}.${f.key}`);
        assert.ok(f.label.en && f.label.ar);
        if (f.options) assert.equal(f.options.en.length, f.options.ar.length, `${t.key}.${f.key} options`);
      }
    }
  });
  it("starts new workspaces with existing library entries", () => {
    for (const key of STARTER_TEMPLATES) assert.ok(TEMPLATE_LIBRARY.some((t) => t.key === key), key);
  });
  it("builds a workspace template in one language", () => {
    const social = TEMPLATE_LIBRARY.find((t) => t.key === "social-media")!;
    const ar = libraryTemplate(social, "ar");
    assert.equal(ar.name, "إدارة السوشال ميديا");
    assert.equal(ar.stages[0].clientApproval, true);
    assert.equal(ar.sourceKey, "social-media");
    assert.deepEqual(ar.fields.find((f) => f.key === "dialect")?.options?.[0], "لهجة سعودية");
  });
});
