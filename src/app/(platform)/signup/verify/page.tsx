import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { emailEnabled } from "@/lib/email";
import { getSaasT } from "@/lib/i18n-saas";
import { currentSignup, resendSignupCode, verifySignupCode } from "@/server/signup-actions";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Field, Input, buttonClass } from "@/components/ui";
import { SignupShell } from "@/components/platform/signup-shell";

export const metadata: Metadata = { title: "Confirm your email · Operra" };

/** Sign-up step 1b: the 6-digit code emailed to the address given on step 1. */
export default async function SignupVerifyPage() {
  const signup = await currentSignup();
  if (!signup) redirect("/signup?expired=1");
  if (signup.orgId) redirect("/signup/provisioning");
  if (!emailEnabled() || signup.emailVerifiedAt) redirect("/signup/company");
  const { t } = await getSaasT();
  const s = t.signup;
  const c = s.emailCode;
  return (
    <SignupShell steps={s.steps} current={0} title={c.title} sub={c.sub(signup.email)}>
      <ActionForm action={verifySignupCode} className="space-y-4">
        <Field label={c.code}>
          <Input name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={7} required autoFocus dir="ltr" />
        </Field>
        <div className="flex items-center justify-between gap-3 pt-2">
          <Link href="/signup" className={buttonClass("ghost")}>
            {c.changeEmail}
          </Link>
          <SubmitButton>{c.verify}</SubmitButton>
        </div>
      </ActionForm>
      <ActionForm action={resendSignupCode} successMessage={c.resent} className="mt-4 border-t border-zinc-100 pt-4">
        <SubmitButton variant="secondary" size="sm">
          {c.resend}
        </SubmitButton>
      </ActionForm>
    </SignupShell>
  );
}
