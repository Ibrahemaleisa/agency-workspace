import Link from "next/link";
import type { Metadata } from "next";
import { emailEnabled } from "@/lib/email";
import { getSaasT } from "@/lib/i18n-saas";
import { forgotPassword } from "@/server/password-actions";
import { ActionForm, SubmitButton } from "@/components/forms";
import { AuthCard, authButton, authField } from "@/components/site/auth-card";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ForgotPasswordPage() {
  const { t } = await getSaasT();
  const r = t.reset;
  return (
    <AuthCard title={r.forgotTitle} sub={r.forgotSub}>
      {emailEnabled() ? (
        <ActionForm action={forgotPassword} className="mt-7 space-y-4" successMessage={r.sent} resetOnSuccess>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-zinc-400">{t.invite.email}</span>
            <input name="email" type="email" required autoComplete="email" dir="ltr" className={`${authField} text-start`} />
          </label>
          <SubmitButton className={authButton}>{r.send}</SubmitButton>
        </ActionForm>
      ) : (
        <p role="status" className="mt-6 text-sm leading-relaxed text-zinc-300">
          {r.noEmail}
        </p>
      )}
      <Link href="/login" className="mt-6 inline-block text-sm text-zinc-400 underline underline-offset-4 hover:text-white">
        {r.signIn}
      </Link>
    </AuthCard>
  );
}
