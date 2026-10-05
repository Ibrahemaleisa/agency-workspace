import { redirect } from "next/navigation";
import { getPlatformAdmin } from "@/lib/platform-admin";
import { platformLogin } from "@/server/platform-admin-actions";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Field, Input } from "@/components/ui";
import { OperraWordmark } from "@/components/platform/operra-mark";

export default async function ControlLogin() {
  if (await getPlatformAdmin()) redirect("/operra");
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-5">
      <OperraWordmark />
      <p className="mt-6 text-xs font-medium text-[#5B606B]">Control center · staff only</p>
      <div className="mt-3 rounded-xl border border-[#E1E2DE] bg-white p-6">
        <ActionForm action={platformLogin} className="space-y-4">
          <Field label="Email"><Input name="email" type="email" required autoComplete="username" /></Field>
          <Field label="Password"><Input name="password" type="password" required autoComplete="current-password" /></Field>
          <SubmitButton className="w-full">Sign in</SubmitButton>
        </ActionForm>
      </div>
    </main>
  );
}
