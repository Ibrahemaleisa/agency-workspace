import { LegalNote } from "@/components/legal-links";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { BadgeCheck, FolderKanban, MessagesSquare } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { isPlatform } from "@/lib/platform";
import { getDict } from "@/lib/lang";
import { getSaasT } from "@/lib/i18n-saas";
import { loginAction } from "@/server/auth-actions";
import { ActionForm, SubmitButton } from "@/components/forms";
import { AuthHeading, AuthShell, authButton, authField, authLabel, authLink } from "@/components/site/auth-card";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDict();
  return { title: t.login.submit };
}

const DEMO_ACCOUNTS = [
  { role: "Admin", email: "sara@northwind.agency" },
  { role: "Employee", email: "omar@northwind.agency" },
  { role: "Client", email: "lina@bloomcafe.com" },
];

const HIGHLIGHT_ICONS = [FolderKanban, BadgeCheck, MessagesSquare];

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  const [{ lang, t, brand }, { t: st }] = await Promise.all([getDict(), getSaasT()]);
  const platform = isPlatform();
  if (!brand.orgId && !platform) redirect("/setup");
  // Single-agency deployments may list the sample logins; the platform uses /preview instead.
  const showDemo = !platform && (process.env.NODE_ENV !== "production" || process.env.SHOW_DEMO_ACCOUNTS === "true");
  // Operra's own sign-in (no tenant yet): people sign in by email and land in their workspace.
  const operraRoot = platform && !brand.orgId;

  // The agency's panel: what its clients and team get from signing in.
  const panel = (
    <ul className="max-w-sm space-y-6">
      {t.login.highlights.map(({ title, text }, i) => {
        const Icon = HIGHLIGHT_ICONS[i];
        return (
          <li key={title} className="flex gap-3.5">
            <Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-sand-200" />
            <span>
              <span className="block font-medium">{title}</span>
              <span className="mt-0.5 block text-sm text-white/65">{text}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );

  return (
    <AuthShell
      brand={brand}
      lang={lang}
      langNext="/login"
      back={!operraRoot && brand.showLanding ? { href: "/", label: t.login.back } : undefined}
      panel={panel}
    >
      <AuthHeading title={t.login.title} sub={t.login.sub} />

      <ActionForm action={loginAction} className="mt-8 space-y-4">
        <label className="block">
          <span className={authLabel}>{t.login.email}</span>
          <input name="email" type="email" autoComplete="email" required autoFocus dir="ltr" className={`${authField} text-start`} />
        </label>
        <label className="block">
          <span className="mb-1.5 flex items-baseline justify-between gap-3">
            <span className="text-sm font-medium text-[#15171C]">{t.login.password}</span>
            <Link href="/forgot-password" className="text-[13px] text-[#5B606B] underline-offset-4 hover:text-[#15171C] hover:underline">
              {st.reset.forgotLink}
            </Link>
          </span>
          <input name="password" type="password" autoComplete="current-password" required dir="ltr" className={`${authField} text-start`} />
        </label>
        <SubmitButton className={`${authButton} mt-2`} pendingText={t.login.pending}>
          {t.login.submit}
        </SubmitButton>
      </ActionForm>

      {operraRoot && (
        <div className="mt-8 space-y-2 border-t border-[#E1E2DE] pt-6 text-sm text-[#5B606B]">
          <p>
            {t.login.newHere}{" "}
            <Link href="/signup" className="font-medium text-[#15171C] underline underline-offset-4">
              {t.login.startTrial}
            </Link>
          </p>
          <p>
            <Link href="/preview" className={authLink}>
              {t.login.preview}
            </Link>
          </p>
        </div>
      )}

      <LegalNote labels={st.legal} className="mt-8 text-xs text-[#5B606B]" />

      {showDemo && (
        <div className="mt-8 rounded-lg border border-dashed border-[#D6D7D2] p-4 text-xs text-[#5B606B]" dir="ltr">
          <div className="mb-2 font-medium text-[#15171C]">
            Demo accounts · password <code className="rounded bg-[#EEEEEA] px-1">password</code>
          </div>
          <ul className="space-y-1.5">
            {DEMO_ACCOUNTS.map((a) => (
              <li key={a.email} className="flex justify-between gap-2">
                <span>{a.role}</span>
                <code className="text-[#15171C]">{a.email}</code>
              </li>
            ))}
          </ul>
        </div>
      )}
    </AuthShell>
  );
}
