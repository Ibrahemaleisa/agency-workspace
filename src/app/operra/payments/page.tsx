import { requirePlatformAdmin } from "@/lib/platform-admin";
import { providerName } from "@/lib/billing";
import { getBankDetails } from "@/lib/billing/manual";
import { appUrl } from "@/lib/platform";
import { saveBankAction } from "@/server/platform-admin-actions";
import { ControlHeader } from "@/components/platform/control-header";
import { ActionForm, SubmitButton } from "@/components/forms";

const field = "mt-1 block w-full rounded-md border border-[#8D929C] bg-white px-2.5 py-1.5 text-sm";
const label = "block text-xs font-medium text-[#5B606B]";

/** How agencies pay: card payments (provider status and set-up) and the optional bank transfer backup. */
export default async function PaymentsPage() {
  const admin = await requirePlatformAdmin();
  const [provider, bank] = [providerName(), await getBankDetails()];
  const webhook = `${appUrl()}/api/billing/webhook`;
  return (
    <>
      <ControlHeader name={admin.name} />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">Payments</h1>

        <section className="mt-6 rounded-lg border border-[#E1E2DE] bg-white p-5 text-sm" data-testid="card-payments">
          <h2 className="text-lg font-semibold">Card payments</h2>
          {provider === "lemonsqueezy" || provider === "stripe" ? (
            <p className="mt-2">
              <span className="me-2 inline-block size-2 rounded-full bg-emerald-600" aria-hidden />
              Connected: <strong>{provider === "lemonsqueezy" ? "Lemon Squeezy" : "Stripe"}</strong>. Agencies pay by card when they subscribe; invoices
              and renewals come from the provider automatically.
            </p>
          ) : (
            <>
              <p className="mt-2">
                <span className="me-2 inline-block size-2 rounded-full bg-[#C42B3C]" aria-hidden />
                <strong>Not connected yet.</strong> Until it is, “Subscribe” records a request that you activate on the home page.
              </p>
              <ol className="mt-4 list-decimal space-y-2 ps-5 text-[#3F434A]">
                <li>Create a free account at lemonsqueezy.com (no company needed) and a store; set its currency.</li>
                <li>Create a product “Operra” with two subscription variants: <em>Standard</em> and <em>Full package</em>, monthly, at your prices.</li>
                <li>Put each variant’s ID on its plan: control center → Plans → “Payment provider ID”.</li>
                <li>
                  Settings → Webhooks → add <code className="font-mono">{webhook}</code> with the subscription events and
                  “subscription_payment_success”; copy its signing secret.
                </li>
                <li>
                  In Vercel (project <code className="font-mono">operra</code>) add <code className="font-mono">LEMONSQUEEZY_API_KEY</code>,{" "}
                  <code className="font-mono">LEMONSQUEEZY_STORE_ID</code>, <code className="font-mono">LEMONSQUEEZY_WEBHOOK_SECRET</code> (sensitive),
                  then redeploy. Add <code className="font-mono">LEMONSQUEEZY_TEST_MODE=true</code> first to try it with a test card.
                </li>
              </ol>
            </>
          )}
        </section>

        <section className="mt-6 rounded-lg border border-[#E1E2DE] bg-white p-5 text-sm">
          <h2 className="text-lg font-semibold">Bank transfer (optional)</h2>
          <p className="mt-1 text-[#5B606B]">
            {provider
              ? "Card payment is on, so bank transfer isn’t offered to agencies."
              : "Only used while card payment isn’t connected: agencies see these details, transfer, and upload the receipt for you to activate. Leave the IBAN empty to turn it off."}
          </p>
          <ActionForm action={saveBankAction} successMessage="Saved." className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className={label}>
              Bank
              <input name="bankName" defaultValue={bank?.bankName ?? ""} className={field} />
            </label>
            <label className={label}>
              Account name
              <input name="accountName" defaultValue={bank?.accountName ?? ""} className={field} />
            </label>
            <label className={`${label} sm:col-span-2`}>
              IBAN
              <input name="iban" defaultValue={bank?.iban ?? ""} placeholder="SA00 0000 0000 0000 0000 0000" className={`${field} font-mono`} dir="ltr" />
            </label>
            <label className={label}>
              Note for agencies (English)
              <textarea name="instructionsEn" rows={3} defaultValue={bank?.instructionsEn ?? ""} className={field} />
            </label>
            <label className={label}>
              Note for agencies (Arabic)
              <textarea name="instructionsAr" rows={3} defaultValue={bank?.instructionsAr ?? ""} className={field} dir="rtl" />
            </label>
            <div className="sm:col-span-2">
              <SubmitButton>Save</SubmitButton>
            </div>
          </ActionForm>
        </section>
      </main>
    </>
  );
}
