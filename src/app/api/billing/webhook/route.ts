import { NextResponse } from "next/server";
import { applyBillingEvent } from "@/lib/billing";
import { normalizeStripeEvent, verifyStripeSignature } from "@/lib/billing/stripe";
import { normalizeLemonSqueezyEvent, verifyLemonSqueezySignature } from "@/lib/billing/lemonsqueezy";

/**
 * Payment provider webhooks (Stripe or Lemon Squeezy, told apart by their signature header):
 * verified, normalised and applied idempotently (duplicates are acknowledged).
 */
export async function POST(request: Request) {
  const payload = await request.text();
  const lsSignature = request.headers.get("x-signature");
  const isLemon = !!lsSignature && !request.headers.get("stripe-signature");
  const valid = isLemon ? verifyLemonSqueezySignature(payload, lsSignature) : verifyStripeSignature(payload, request.headers.get("stripe-signature"));
  if (!valid) return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  try {
    const event = JSON.parse(payload);
    const normalized = isLemon ? normalizeLemonSqueezyEvent(event) : await normalizeStripeEvent(event);
    if (normalized) await applyBillingEvent(normalized);
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(isLemon ? "[lemonsqueezy webhook]" : "[stripe webhook]", err);
    // 500 makes the provider retry later; the event id keeps the retry idempotent.
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }
}
