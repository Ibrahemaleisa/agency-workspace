import type { Metadata } from "next";
import { getBrand, orgBrand } from "@/lib/brand";
import { getSaasT } from "@/lib/i18n-saas";
import { getLang } from "@/lib/lang";
import { acceptInvitation, findInvitation } from "@/server/invite-actions";
import { ActionForm, SubmitButton } from "@/components/forms";
import { AuthHeading, AuthShell, authButton, authField } from "@/components/site/auth-card";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function InvitePage({ params }: PageProps<"/invite/[token]">) {
  const { token } = await params;
  const [found, lang, { t }] = await Promise.all([findInvitation(token), getLang(), getSaasT()]);
  const iv = t.invite;

  if (!found) {
    return (
      <AuthShell brand={await getBrand()} lang={lang} langNext={`/invite/${token}`}>
        <AuthHeading title={iv.invalidTitle} sub={iv.invalidBody} />
      </AuthShell>
    );
  }

  const brand = orgBrand(found.org);
  const role = t.roles[found.invite.role];
  return (
    // The invitation always wears the inviting agency's brand.
    <AuthShell brand={brand} lang={lang} langNext={`/invite/${token}`}>
      <AuthHeading
        title={iv.acceptTitle(brand.name[lang])}
        sub={found.hasAccount ? iv.acceptSubExisting(role) : iv.acceptSub(role)}
      />
      <ActionForm action={acceptInvitation} className="mt-7 space-y-4">
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="lang" value={lang} />
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-[#15171C]">{iv.email}</span>
          <input value={found.invite.email} readOnly dir="ltr" className={`${authField} text-start opacity-70`} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-[#15171C]">{iv.name}</span>
          <input name="name" required autoComplete="name" autoFocus className={authField} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-[#15171C]">{found.hasAccount ? iv.existingPassword : iv.password}</span>
          <input
            name="password"
            type="password"
            required
            minLength={found.hasAccount ? undefined : 8}
            autoComplete={found.hasAccount ? "current-password" : "new-password"}
            dir="ltr"
            className={`${authField} text-start`}
          />
          {!found.hasAccount && <span className="mt-1 block text-xs text-[#5B606B]">{iv.passwordHint}</span>}
        </label>
        <SubmitButton className={`${authButton} mt-2`}>
          {iv.accept}
        </SubmitButton>
      </ActionForm>
    </AuthShell>
  );
}
