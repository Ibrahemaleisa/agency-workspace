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
      <p className="mt-6 font-mono text-[11px] tracking-[0.08em] text-[#5A606B] uppercase">Control center · staff only</p>
      <div className="mt-3 rounded-xl border border-[#E3E4E0] bg-white p-6">
        <ActionForm action={platformLogin} className="space-y-4">
          <Field label="Email"><Input name="email" type="email" required autoComplete="username" /></Field>
          <Field label="Password"><Input name="password" type="password" required autoComplete="current-password" /></Field>
          <SubmitButton className="w-full">Sign in</SubmitButton>
        </ActionForm>
      </div>
    </main>
  );
}
