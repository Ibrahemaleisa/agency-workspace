import Link from "next/link";
import type { Metadata } from "next";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { plans } from "@/db/schema";
import { getSaasT } from "@/lib/i18n-saas";
import { getLang } from "@/lib/lang";
import { currentSignup, signupAccount } from "@/server/signup-actions";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Field, Input } from "@/components/ui";
import { SignupShell } from "@/components/platform/signup-shell";

export const metadata: Metadata = { title: "Start your Operra workspace" };

export default async function SignupAccountPage({ searchParams }: PageProps<"/signup">) {
  const sp = await searchParams;
  const { t } = await getSaasT();
  const s = t.signup;
  const existing = await currentSignup();
  const planCode = typeof sp.plan === "string" ? sp.plan : (existing?.planCode ?? "workspace");
  const lang = await getLang();
  const offered = await db.select().from(plans).where(eq(plans.active, true)).orderBy(asc(plans.sort), asc(plans.code));
  const plan =
    offered.find((p) => p.code === planCode) ??
    offered[0] ??
    (await db.query.plans.findFirst({ where: and(eq(plans.code, planCode)) })) ??
    (await db.query.plans.findFirst());
  const fmt = (p: NonNullable<typeof plan>) =>
    p.priceCents != null
      ? `${new Intl.NumberFormat(lang === "ar" ? "ar-SA-u-nu-latn" : "en", { style: "currency", currency: p.currency, maximumFractionDigits: p.priceCents % 100 ? 2 : 0 }).format(p.priceCents / 100)} / ${p.interval === "year" ? s.account.perYear : s.account.perMonth}`
      : s.account.onRequest;
  const nameOf = (p: NonNullable<typeof plan>) => (lang === "ar" && p.nameAr) || p.name;
  const price = plan?.priceCents != null ? fmt(plan) : null;

  return (
    <SignupShell
      steps={s.steps}
      current={0}
      title={s.account.title}
      sub={s.account.sub}
      aside={
        plan && (
          <div className="rounded-xl border border-[#E1E2DE] bg-white p-5 sm:p-6 lg:mt-[92px]">
            <p className="text-xs font-medium text-[#5B606B]">{s.account.plan}</p>
            <p className="mt-2 text-lg font-semibold">{nameOf(plan)}</p>
            <p className="mt-1 text-sm text-[#5B606B]">
              {s.start.trialTitle(plan.trialDays)}
              {price && ` · ${price}`}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-[#5B606B]">{s.start.trialBody}</p>
            <p className="mt-6 border-t border-[#E1E2DE] pt-4 text-sm">
              <Link href="/preview" className="underline underline-offset-4">
                {s.account.preview}
              </Link>
            </p>
          </div>
        )
      }
    >
      {sp.expired && <p className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">{s.errors.expired}</p>}
      <ActionForm action={signupAccount} className="space-y-4">
        <input type="hidden" name="plan" value={plan?.code ?? "full"} />
        <Field label={s.account.name}>
          <Input name="name" required autoComplete="name" autoFocus defaultValue={existing?.name ?? ""} />
        </Field>
        <Field label={s.account.email}>
          <Input name="email" type="email" required autoComplete="email" dir="ltr" defaultValue={existing?.email ?? ""} />
        </Field>
        <Field label={s.account.password} hint={s.account.passwordHint}>
          <Input name="password" type="password" required minLength={8} autoComplete="new-password" dir="ltr" />
        </Field>
        <SubmitButton className="w-full">{s.continue}</SubmitButton>
        <p className="text-center text-sm text-zinc-500">
          {s.account.haveAccount}{" "}
          <Link href="/login" className="font-medium text-zinc-900 underline underline-offset-4">
            {s.account.signIn}
          </Link>
        </p>
      </ActionForm>
    </SignupShell>
  );
}
