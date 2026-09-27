import Link from "next/link";
import type { Metadata } from "next";
import { getSaasT } from "@/lib/i18n-saas";
import { setNewPassword } from "@/server/password-actions";
import { ActionForm, SubmitButton } from "@/components/forms";
import { AuthCard, authButton, authField } from "@/components/site/auth-card";

export const metadata: Metadata = { robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";
  const { t } = await getSaasT();
  const r = t.reset;
  return (
    <AuthCard title={r.newTitle} sub={token ? r.newSub : undefined}>
      {token ? (
        <ActionForm action={setNewPassword} className="mt-7 space-y-4" successMessage={r.done}>
          <input type="hidden" name="token" value={token} />
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-zinc-400">{r.newPassword}</span>
            <input name="password" type="password" required minLength={8} autoComplete="new-password" dir="ltr" className={`${authField} text-start`} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-zinc-400">{r.confirm}</span>
            <input name="confirm" type="password" required minLength={8} autoComplete="new-password" dir="ltr" className={`${authField} text-start`} />
          </label>
          <SubmitButton className={authButton}>{r.save}</SubmitButton>
        </ActionForm>
      ) : (
        <p role="alert" className="mt-4 text-sm text-zinc-400">
          {r.invalid}
        </p>
      )}
      <Link href="/login" className="mt-6 inline-block text-sm text-zinc-400 underline underline-offset-4 hover:text-white">
        {r.signIn}
      </Link>
    </AuthCard>
  );
}
