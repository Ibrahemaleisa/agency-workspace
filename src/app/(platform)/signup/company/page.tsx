import { emailEnabled } from "@/lib/email";
import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSaasT } from "@/lib/i18n-saas";
import { currentSignup, signupCompany } from "@/server/signup-actions";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Field, Input, Select, buttonClass } from "@/components/ui";
import { SignupShell } from "@/components/platform/signup-shell";

export const metadata: Metadata = { title: "Your agency · Operra" };

export default async function SignupCompanyPage() {
  const signup = await currentSignup();
  if (!signup) redirect("/signup?expired=1");
  if (signup.orgId) redirect("/signup/provisioning");
  if (emailEnabled() && !signup.emailVerifiedAt) redirect("/signup/verify");
  const { t, lang } = await getSaasT();
  const s = t.signup;
  return (
    <SignupShell steps={s.steps} current={1} title={s.company.title} sub={s.company.sub}>
      <ActionForm action={signupCompany} className="space-y-4">
        <Field label={s.company.name}>
          <Input name="companyName" required autoFocus defaultValue={signup.companyName ?? ""} />
        </Field>
        <Field label={s.company.nameAr} hint={s.company.nameArHint}>
          <Input name="companyNameAr" dir="rtl" defaultValue={signup.companyNameAr ?? ""} />
        </Field>
        <Field label={s.company.lang}>
          <Select
            name="defaultLang"
            defaultValue={signup.defaultLang ?? lang}
            options={[
              { value: "en", label: s.company.langEn },
              { value: "ar", label: s.company.langAr },
            ]}
          />
        </Field>
        <div className="flex items-center justify-between gap-3 pt-2">
          <Link href="/signup" className={buttonClass("ghost")}>
            {s.back}
          </Link>
          <SubmitButton>{s.continue}</SubmitButton>
        </div>
      </ActionForm>
    </SignupShell>
  );
}
