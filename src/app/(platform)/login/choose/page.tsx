import Link from "next/link";
import type { Metadata } from "next";
import { chooseWorkspace } from "@/server/auth-actions";
import { membershipsOf } from "@/lib/auth";
import { orgBrand } from "@/lib/brand";
import { chooserAccount } from "@/lib/handoff";
import { getSaasT } from "@/lib/i18n-saas";
import { tenantEntryUrl } from "@/lib/platform";
import { BrandMark } from "@/components/site/brand";
import { buttonClass } from "@/components/ui";

export const metadata: Metadata = { title: "Choose an agency · Operra" };

/** After sign-in, for people who belong to more than one agency. */
export default async function ChooseWorkspacePage() {
  const { t, lang } = await getSaasT();
  const c = t.chooser;
  const accountId = await chooserAccount();
  const memberships = accountId ? await membershipsOf(accountId) : [];

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-[32px] leading-[38px] font-semibold tracking-[-0.02em]">{c.title}</h1>
      {memberships.length === 0 ? (
        <p role="alert" className="mt-4 text-[#5B606B]">
          {c.expired}
        </p>
      ) : (
        <>
          <p className="mt-3 text-[16px] leading-[24px] text-[#5B606B]">{c.sub}</p>
          <ul className="mt-8 divide-y divide-[#E1E2DE] overflow-hidden rounded-xl border border-[#E1E2DE] bg-white">
            {memberships.map(({ user, org }) => {
              const brand = orgBrand(org);
              return (
                <li key={user.id} className="flex items-center gap-4 p-4">
                  <BrandMark logo={brand.logo} name={brand.name[lang]} className="h-10" variant="light" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{brand.name[lang]}</p>
                    <p className="truncate font-mono text-xs text-[#5B606B]" dir="ltr">
                      {tenantEntryUrl(org).replace(/^https?:\/\//, "")}
                    </p>
                    <p className="text-xs text-[#5B606B]">{t.roles[user.role]}</p>
                  </div>
                  <form action={chooseWorkspace}>
                    <input type="hidden" name="membershipId" value={user.id} />
                    <button className={buttonClass("primary")} data-testid="choose-workspace">
                      {c.open}
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        </>
      )}
      <Link href="/login" className="mt-6 inline-block text-sm text-[#5B606B] underline underline-offset-4">
        {c.other}
      </Link>
    </div>
  );
}
