import { redirect } from "next/navigation";
import { count } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getT } from "@/lib/lang";
import { createWorkspace } from "@/server/setup-actions";
import { ActionForm, SubmitButton } from "@/components/forms";
import { DEFAULT_BRAND } from "@/lib/brand";
import { AuthHeading, AuthShell, authButton, authField } from "@/components/site/auth-card";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t.setup.title };
}

export default async function SetupPage() {
  // Only a brand-new deployment (no users yet) can be set up.
  const [{ n }] = await db.select({ n: count() }).from(users);
  if (n > 0) redirect("/login");
  const { t, lang } = await getT();
  const s = t.setup;

  return (
    <AuthShell brand={DEFAULT_BRAND} lang={lang} langNext="/setup">
      <div>
        <AuthHeading title={s.title} sub={s.subtitle} />
        <ActionForm action={createWorkspace} className="mt-8 space-y-6">
          <fieldset className="space-y-3">
            <legend className="mb-2 text-sm font-semibold text-[#15171C]">{s.agency}</legend>
            <Label text={t.brandSettings.nameEn}>
              <input name="agency" required dir="ltr" className={`${authField} text-start`} />
            </Label>
            <Label text={t.brandSettings.nameAr}>
              <input name="agencyAr" dir="rtl" className={`${authField} text-start`} />
            </Label>
          </fieldset>
          <fieldset className="space-y-3">
            <legend className="mb-2 text-sm font-semibold text-[#15171C]">{s.admin}</legend>
            <Label text={s.name}>
              <input name="name" required autoComplete="name" className={authField} />
            </Label>
            <Label text={s.email}>
              <input name="email" type="email" required autoComplete="email" dir="ltr" className={`${authField} text-start`} />
            </Label>
            <Label text={s.password}>
              <input name="password" type="password" required minLength={8} autoComplete="new-password" dir="ltr" className={`${authField} text-start`} />
            </Label>
          </fieldset>
          <SubmitButton className={authButton}>
            {s.create}
          </SubmitButton>
        </ActionForm>
      </div>
    </AuthShell>
  );
}

function Label({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-[#15171C]">{text}</span>
      {children}
    </label>
  );
}
