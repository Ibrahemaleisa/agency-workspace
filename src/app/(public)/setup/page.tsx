import { redirect } from "next/navigation";
import { count } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getT } from "@/lib/lang";
import { createWorkspace } from "@/server/setup-actions";
import { ActionForm, SubmitButton } from "@/components/forms";
import { LangSwitch } from "@/components/site/lang-switch";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t.setup.title };
}

const field =
  "block w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none transition focus:border-sand-200/60 focus:bg-white/[0.08] focus:ring-4 focus:ring-sand-200/10";

export default async function SetupPage() {
  // Only a brand-new deployment (no users yet) can be set up.
  const [{ n }] = await db.select({ n: count() }).from(users);
  if (n > 0) redirect("/login");
  const { t, lang } = await getT();
  const s = t.setup;

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col px-5 py-8">
      <div className="flex justify-end">
        <LangSwitch lang={lang} next="/setup" />
      </div>
      <div className="flex flex-1 flex-col justify-center py-8">
        <h1 className="font-display text-3xl font-bold text-white">{s.title}</h1>
        <p className="mt-2 text-sm text-zinc-400">{s.subtitle}</p>
        <ActionForm action={createWorkspace} className="mt-8 space-y-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <fieldset className="space-y-3">
            <legend className="mb-2 text-xs font-semibold tracking-wide text-sand-200 uppercase">{s.agency}</legend>
            <Label text={t.brandSettings.nameEn}>
              <input name="agency" required dir="ltr" className={`${field} text-start`} />
            </Label>
            <Label text={t.brandSettings.nameAr}>
              <input name="agencyAr" dir="rtl" className={`${field} text-start`} />
            </Label>
          </fieldset>
          <fieldset className="space-y-3">
            <legend className="mb-2 text-xs font-semibold tracking-wide text-sand-200 uppercase">{s.admin}</legend>
            <Label text={s.name}>
              <input name="name" required autoComplete="name" className={field} />
            </Label>
            <Label text={s.email}>
              <input name="email" type="email" required autoComplete="email" dir="ltr" className={`${field} text-start`} />
            </Label>
            <Label text={s.password}>
              <input name="password" type="password" required minLength={8} autoComplete="new-password" dir="ltr" className={`${field} text-start`} />
            </Label>
          </fieldset>
          <SubmitButton className="w-full rounded-xl bg-sand-200! py-3 text-base font-semibold text-ink! shadow-none! hover:bg-sand-100!">
            {s.create}
          </SubmitButton>
        </ActionForm>
      </div>
    </main>
  );
}

function Label({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-zinc-400">{text}</span>
      {children}
    </label>
  );
}
