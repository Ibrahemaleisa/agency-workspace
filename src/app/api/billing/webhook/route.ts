import { NextResponse } from "next/server";
import { applyBillingEvent } from "@/lib/billing";
import { normalizeStripeEvent, verifyStripeSignature } from "@/lib/billing/stripe";

/** Stripe webhook: verified, normalised and applied idempotently (duplicates are acknowledged). */
export async function POST(request: Request) {
  const payload = await request.text();
  if (!verifyStripeSignature(payload, request.headers.get("stripe-signature"))) {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }
  try {
    const event = JSON.parse(payload);
    const normalized = await normalizeStripeEvent(event);
    if (normalized) await applyBillingEvent(normalized);
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[stripe webhook]", err);
    // 500 makes Stripe retry later; the event id keeps the retry idempotent.
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }
}
