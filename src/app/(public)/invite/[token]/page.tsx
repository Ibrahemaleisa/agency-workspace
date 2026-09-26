import type { Metadata } from "next";
import { brandCss, orgBrand } from "@/lib/brand";
import { getSaasT } from "@/lib/i18n-saas";
import { getLang } from "@/lib/lang";
import { acceptInvitation, findInvitation } from "@/server/invite-actions";
import { ActionForm, SubmitButton } from "@/components/forms";
import { BrandLogo } from "@/components/site/brand";
import { LangSwitch } from "@/components/site/lang-switch";

export const metadata: Metadata = { robots: { index: false, follow: false } };

const field =
  "block w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none transition focus:border-sand-200/60 focus:bg-white/[0.08] focus:ring-4 focus:ring-sand-200/10";

export default async function InvitePage({ params }: PageProps<"/invite/[token]">) {
  const { token } = await params;
  const [found, lang, { t }] = await Promise.all([findInvitation(token), getLang(), getSaasT()]);
  const iv = t.invite;

  if (!found) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-12">
        <h1 className="font-display text-2xl font-semibold text-white">{iv.invalidTitle}</h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">{iv.invalidBody}</p>
      </main>
    );
  }

  const brand = orgBrand(found.org);
  const role = t.roles[found.invite.role];
  return (
    <>
      {/* The invitation always wears the inviting agency's brand. */}
      <style>{brandCss(brand)}</style>
      <main className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-8">
        <div className="flex items-center justify-between">
          <BrandLogo logo={brand.logo} name={brand.name[lang]} />
          <LangSwitch lang={lang} next={`/invite/${token}`} />
        </div>
        <div className="flex flex-1 flex-col justify-center py-10">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl md:p-8">
            <h1 className="font-display text-2xl font-semibold text-white">{iv.acceptTitle(brand.name[lang])}</h1>
            <p className="mt-1.5 text-sm text-zinc-400">{iv.acceptSub(role)}</p>
            <ActionForm action={acceptInvitation} className="mt-7 space-y-4">
              <input type="hidden" name="token" value={token} />
              <input type="hidden" name="lang" value={lang} />
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-zinc-400">{iv.email}</span>
                <input value={found.invite.email} readOnly dir="ltr" className={`${field} text-start opacity-70`} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-zinc-400">{iv.name}</span>
                <input name="name" required autoComplete="name" autoFocus className={field} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-zinc-400">{iv.password}</span>
                <input name="password" type="password" required minLength={8} autoComplete="new-password" dir="ltr" className={`${field} text-start`} />
                <span className="mt-1 block text-xs text-zinc-500">{iv.passwordHint}</span>
              </label>
              <SubmitButton className="w-full rounded-xl bg-sand-200! py-3 text-base font-semibold text-ink! shadow-none! hover:bg-sand-100!">
                {iv.accept}
              </SubmitButton>
            </ActionForm>
          </div>
        </div>
      </main>
    </>
  );
}
