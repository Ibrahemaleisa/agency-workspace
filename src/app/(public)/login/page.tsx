import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, BadgeCheck, FolderKanban, MessagesSquare } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { isPlatform } from "@/lib/platform";
import { getDict } from "@/lib/lang";
import { getSaasT } from "@/lib/i18n-saas";
import { loginAction } from "@/server/auth-actions";
import { ActionForm, SubmitButton } from "@/components/forms";
import { BrandLogo } from "@/components/site/brand";
import { LangSwitch } from "@/components/site/lang-switch";

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

const field =
  "block w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none transition focus:border-sand-200/60 focus:bg-white/[0.08] focus:ring-4 focus:ring-sand-200/10";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  const [{ lang, t, brand }, { t: st }] = await Promise.all([getDict(), getSaasT()]);
  const platform = isPlatform();
  if (!brand.orgId && !platform) redirect("/setup");
  // Single-agency deployments may list the sample logins; the platform uses /preview instead.
  const showDemo = !platform && (process.env.NODE_ENV !== "production" || process.env.SHOW_DEMO_ACCOUNTS === "true");
  // Operra's own sign-in (no tenant yet): people sign in by email and land in their workspace.
  const operraRoot = platform && !brand.orgId;
  const Back = lang === "ar" ? ArrowRight : ArrowLeft;

  return (
    <div className="relative flex min-h-screen overflow-hidden">
      <div className="starfield starfield-slow pointer-events-none absolute inset-0 opacity-50" />
      <div className="pointer-events-none absolute -top-40 -end-40 size-[560px] rounded-full bg-sand-200/[0.07] blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-48 -start-32 size-[480px] rounded-full bg-white/[0.04] blur-[120px]" />

      {/* Story panel (desktop) */}
      <aside className="relative hidden w-1/2 flex-col p-12 lg:flex">
        <Link href="/">
          <BrandLogo logo={brand.logo} name={brand.name[lang]} />
        </Link>
        <div className="mt-auto max-w-md">
          <h2 className="font-display text-4xl leading-tight font-bold text-white">
            {t.hero.title1}{" "}
            <span className="bg-gradient-to-r from-sand-100 to-sand-400 bg-clip-text text-transparent">{t.hero.title2}</span>
          </h2>
          <ul className="mt-10 space-y-6">
            {t.login.highlights.map(({ title, text }, i) => {
              const Icon = HIGHLIGHT_ICONS[i];
              return (
                <li key={title} className="flex gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
                    <Icon className="size-5 text-sand-200" />
                  </span>
                  <span>
                    <span className="font-display block font-medium text-white">{title}</span>
                    <span className="mt-0.5 block text-sm text-zinc-400">{text}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="mt-auto" />
      </aside>

      {/* Form */}
      <main className="relative flex flex-1 flex-col px-5 py-6 md:px-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white">
            <Back className="size-4" /> {t.login.back}
          </Link>
          <LangSwitch lang={lang} next="/login" />
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">
            <div className="mb-8 lg:hidden">
              <BrandLogo logo={brand.logo} name={brand.name[lang]} />
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl backdrop-blur-xl md:p-8">
              <h1 className="font-display text-2xl font-semibold text-white">{t.login.title}</h1>
              <p className="mt-1.5 text-sm text-zinc-400">{t.login.sub}</p>

              <ActionForm action={loginAction} className="mt-7 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-zinc-400">{t.login.email}</span>
                  <input name="email" type="email" autoComplete="email" required autoFocus dir="ltr" className={`${field} text-start`} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-zinc-400">{t.login.password}</span>
                  <input name="password" type="password" autoComplete="current-password" required dir="ltr" className={`${field} text-start`} />
                  <Link href="/forgot-password" className="mt-1.5 inline-block text-xs text-zinc-400 underline-offset-4 hover:text-white hover:underline">
                    {st.reset.forgotLink}
                  </Link>
                </label>
                <SubmitButton
                  className="w-full rounded-xl bg-sand-200! py-3 text-base font-semibold text-ink! shadow-none! hover:bg-sand-100!"
                  pendingText={t.login.pending}
                >
                  {t.login.submit}
                </SubmitButton>
              </ActionForm>
            </div>

            {operraRoot && (
              <div className="mt-6 space-y-2 text-center text-sm text-zinc-400">
                <p>
                  {t.login.newHere}{" "}
                  <Link href="/signup" className="font-medium text-white underline underline-offset-4">
                    {t.login.startTrial}
                  </Link>
                </p>
                <p>
                  <Link href="/preview" className="underline underline-offset-4 hover:text-white">
                    {t.login.preview}
                  </Link>
                </p>
              </div>
            )}

            {showDemo && (
              <div className="mt-6 rounded-2xl border border-dashed border-white/15 p-4 text-xs text-zinc-400" dir="ltr">
                <div className="mb-2 font-medium text-zinc-300">
                  Demo accounts · password <code className="rounded bg-white/10 px-1">password</code>
                </div>
                <ul className="space-y-1.5">
                  {DEMO_ACCOUNTS.map((a) => (
                    <li key={a.email} className="flex justify-between gap-2">
                      <span className="text-zinc-500">{a.role}</span>
                      <code>{a.email}</code>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
