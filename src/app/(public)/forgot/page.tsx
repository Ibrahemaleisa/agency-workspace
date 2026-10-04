import Link from "next/link";
import type { Metadata } from "next";
import { getDict } from "@/lib/lang";
import { requestPasswordReset } from "@/server/auth-actions";
import { ActionForm, SubmitButton } from "@/components/forms";
import { AuthShell, authField, authSubmit } from "@/components/site/auth-shell";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDict();
  return { title: t.reset.title };
}

export default async function ForgotPasswordPage() {
  const { lang, t, brand } = await getDict();
  return (
    <AuthShell brand={brand} lang={lang} path="/forgot" title={t.reset.title} sub={t.reset.sub}>
      <ActionForm action={requestPasswordReset} successMessage={t.reset.sent} resetOnSuccess className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-zinc-400">{t.reset.email}</span>
          <input name="email" type="email" autoComplete="email" required autoFocus dir="ltr" className={`${authField} text-start`} />
        </label>
        <SubmitButton className={authSubmit}>{t.reset.send}</SubmitButton>
      </ActionForm>
      <Link href="/login" className="mt-5 block text-center text-sm text-zinc-400 transition hover:text-white">
        {t.reset.backToLogin}
      </Link>
    </AuthShell>
  );
}
