import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSaasT } from "@/lib/i18n-saas";
import { currentSignup, enterNewWorkspace, runProvisioning } from "@/server/signup-actions";
import { SignupShell } from "@/components/platform/signup-shell";
import { ProvisioningRunner } from "@/components/platform/provisioning-runner";

export const metadata: Metadata = { title: "Setting up your workspace · Operra" };

export default async function ProvisioningPage() {
  const signup = await currentSignup();
  if (!signup) redirect("/signup?expired=1");
  if (signup.step < 4) redirect("/signup/start");
  const { t } = await getSaasT();
  const p = t.signup.provisioning;
  return (
    <SignupShell steps={t.signup.steps} current={4} title={p.title}>
      <ProvisioningRunner
        run={runProvisioning}
        enter={enterNewWorkspace}
        labels={{ ...p, restart: t.signup.back }}
      />
    </SignupShell>
  );
}
