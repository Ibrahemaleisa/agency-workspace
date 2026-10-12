import { redirect } from "next/navigation";
import { getPlatformSession } from "@/lib/platform-admin";
import { platformLogout, verifySecondFactor } from "@/server/platform-admin-actions";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Field, Input } from "@/components/ui";
import { OperraWordmark } from "@/components/platform/operra-mark";

/** Second sign-in step for Operra staff: the code from their authenticator app. */
export default async function ControlSecondFactor() {
  const s = await getPlatformSession();
  if (!s) redirect("/operra/login");
  if (!s.pending2fa) redirect("/operra");
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-5">
      <OperraWordmark />
      <p className="mt-6 text-xs font-medium text-[#5B606B]">Control center · two-step sign-in</p>
      <div className="mt-3 rounded-xl border border-[#E1E2DE] bg-white p-6">
        <p className="mb-4 text-sm text-[#5B606B]">Enter the 6-digit code from your authenticator app for {s.admin.email}.</p>
        <ActionForm action={verifySecondFactor} className="space-y-4">
          <Field label="Code">
            <Input name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" maxLength={7} required autoFocus dir="ltr" />
          </Field>
          <SubmitButton className="w-full">Verify</SubmitButton>
        </ActionForm>
        <form action={platformLogout} className="mt-4 text-center">
          <button className="text-xs text-[#5B606B] underline underline-offset-4">Use another account</button>
        </form>
      </div>
    </main>
  );
}
