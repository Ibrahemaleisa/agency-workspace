import Link from "next/link";
import type { Metadata } from "next";
import { getSaasT } from "@/lib/i18n-saas";
import { confirmEmail } from "@/server/verification-actions";
import { ActionForm, SubmitButton } from "@/components/forms";
import { AuthCard, authButton } from "@/components/site/auth-card";

export const metadata: Metadata = { robots: { index: false, follow: false }, referrer: "no-referrer" };

/**
 * The emailed confirmation link lands here. Confirming takes a button press (a POST), so mail
 * scanners that pre-open links can't use the single-use token up.
 */
export default async function VerifyEmailPage({ searchParams }: PageProps<"/verify-email">) {
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";
  const { t } = await getSaasT();
  const v = t.verify;
  return (
    <AuthCard title={v.pageTitle} sub={token ? v.pageBody : undefined}>
      {token ? (
        <ActionForm action={confirmEmail} className="mt-7 space-y-4" successMessage={v.done}>
          <input type="hidden" name="token" value={token} />
          <SubmitButton className={authButton}>{v.confirm}</SubmitButton>
        </ActionForm>
      ) : (
        <p role="alert" className="mt-3 text-sm text-zinc-400">
          {v.invalid}
        </p>
      )}
      <Link href="/" className="mt-6 inline-block text-sm text-zinc-400 underline underline-offset-4 hover:text-white">
        {v.continue}
      </Link>
    </AuthCard>
  );
}
