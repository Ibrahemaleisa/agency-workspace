import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { billingProvider } from "@/lib/billing";
import { verify } from "@/lib/secret";
import { getOrgById } from "@/lib/tenant";
import { completeTestCheckout } from "@/server/billing-actions";
import { buttonClass } from "@/components/ui";

export const metadata: Metadata = { title: "Test checkout · Operra", robots: { index: false } };

/** Stand-in for the payment provider's checkout while BILLING_PROVIDER=test. Nothing is charged. */
export default async function TestCheckoutPage({ searchParams }: PageProps<"/billing/test-checkout">) {
  const token = String((await searchParams).t ?? "");
  const data = verify<{ orgId: string; planCode: string }>(token);
  if (!data || billingProvider()?.name !== "test") notFound();
  const org = await getOrgById(data.orgId);
  if (!org) notFound();
  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="rounded-xl border-2 border-dashed border-amber-400 bg-amber-50 p-4 text-sm text-amber-900" role="note">
        <strong className="block font-semibold">TEST MODE — no real payment</strong>
        This page simulates the payment provider so the subscription flow can be tested end to end. No card is
        collected and nothing is charged. It is unavailable in production.
      </div>
      <div className="mt-6 rounded-xl border border-[#E3E4E0] bg-white p-6">
        <p className="font-mono text-[11px] tracking-[0.08em] text-[#5A606B] uppercase">{org.serial}</p>
        <h1 className="mt-2 text-xl font-semibold">{org.name}</h1>
        <p className="mt-1 text-sm text-zinc-600">Plan: {data.planCode}</p>
        <form action={completeTestCheckout} className="mt-6 flex flex-col gap-2 sm:flex-row">
          <input type="hidden" name="t" value={token} />
          <button name="outcome" value="pay" className={buttonClass("primary")}>
            Simulate successful payment
          </button>
          <button name="outcome" value="cancel" className={buttonClass("secondary")}>
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}
