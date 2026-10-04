import Link from "next/link";
import type { Metadata } from "next";
import { findPasswordReset } from "@/lib/auth";
import { getDict } from "@/lib/lang";
import { resetPassword } from "@/server/auth-actions";
import { ActionForm, SubmitButton } from "@/components/forms";
import { AuthShell, authField, authSubmit } from "@/components/site/auth-shell";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDict();
  return { title: t.reset.newTitle, referrer: "no-referrer" };
}

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset">) {
  const { lang, t, brand } = await getDict();
  const raw = (await searchParams).token;
  const token = typeof raw === "string" ? raw : "";
  const valid = token && (await findPasswordReset(token));
  return (
    <AuthShell brand={brand} lang={lang} path="/login" title={t.reset.newTitle}>
      {valid ? (
        <ActionForm action={resetPassword} className="space-y-4">
          <input type="hidden" name="token" value={token} />
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-zinc-400">{t.reset.newPassword}</span>
            <input name="password" type="password" required minLength={8} autoFocus autoComplete="new-password" dir="ltr" className={`${authField} text-start`} />
          </label>
          <SubmitButton className={authSubmit}>{t.reset.save}</SubmitButton>
        </ActionForm>
      ) : (
        <>
          <p className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{t.reset.invalid}</p>
          <Link href="/forgot" className="mt-5 block text-center text-sm text-sand-200 hover:text-white">
            {t.reset.send}
          </Link>
        </>
      )}
    </AuthShell>
  );
}
