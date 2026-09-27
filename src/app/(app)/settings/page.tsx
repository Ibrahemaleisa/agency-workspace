import Link from "next/link";
import { ArrowLeft, ArrowRight, CreditCard, LayoutTemplate, Palette, Users } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getT } from "@/lib/lang";
import { isPlatform } from "@/lib/platform";
import { changeOwnPassword, updateProfile } from "@/server/profile-actions";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Card, Checkbox, Field, Input, PageHeader, Select } from "@/components/ui";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t.settings.title };
}

/** Settings: every user's own profile and password; admins also get the workspace's settings pages. */
export default async function SettingsPage() {
  const user = await requireUser({ allowLocked: true });
  const { t, lang } = await getT();
  const st = t.settings;
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;

  const cards = [
    { href: "/settings/brand", icon: Palette, text: st.cards.brand, show: can(user, "brand.manage") },
    { href: "/team", icon: Users, text: st.cards.team, show: can(user, "users.manage") },
    { href: "/templates", icon: LayoutTemplate, text: st.cards.templates, show: can(user, "templates.manage") },
    { href: "/settings/billing", icon: CreditCard, text: st.cards.billing, show: can(user, "billing.manage") && isPlatform() },
  ].filter((c) => c.show);

  return (
    <>
      <PageHeader title={st.title} description={st.sub} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={st.profileTitle}>
          <p className="-mt-1 mb-4 text-sm text-zinc-500">{st.profileSub}</p>
          <ActionForm action={updateProfile} successMessage={st.saved} className="space-y-4">
            <Field label={st.name}>
              <Input name="name" defaultValue={user.name} required autoComplete="name" />
            </Field>
            {user.role !== "client" && (
              <Field label={st.jobTitle}>
                <Input name="title" defaultValue={user.title ?? ""} autoComplete="organization-title" />
              </Field>
            )}
            <Field label={st.language}>
              <Select
                name="lang"
                defaultValue={user.lang}
                options={[
                  { value: "ar", label: "العربية" },
                  { value: "en", label: "English" },
                ]}
              />
            </Field>
            <Checkbox name="emailNotifications" defaultChecked={user.emailNotifications} label={st.emailNotifications} />
            <SubmitButton>{st.save}</SubmitButton>
          </ActionForm>
        </Card>

        <Card title={st.passwordTitle}>
          <p className="-mt-1 mb-4 text-sm text-zinc-500">{st.passwordSub}</p>
          <ActionForm action={changeOwnPassword} successMessage={st.passwordChanged} resetOnSuccess className="space-y-4">
            <Field label={st.currentPassword}>
              <Input name="current" type="password" required autoComplete="current-password" dir="ltr" />
            </Field>
            <Field label={st.newPassword}>
              <Input name="password" type="password" required minLength={8} autoComplete="new-password" dir="ltr" />
            </Field>
            <Field label={st.confirmPassword}>
              <Input name="confirm" type="password" required minLength={8} autoComplete="new-password" dir="ltr" />
            </Field>
            <SubmitButton>{st.changePassword}</SubmitButton>
          </ActionForm>
        </Card>
      </div>

      {cards.length > 0 && (
        <section aria-labelledby="workspace-settings" className="mt-8">
          <h2 id="workspace-settings" className="text-lg font-semibold">{st.workspaceTitle}</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {cards.map(({ href, icon: Icon, text: [title, body] }) => (
              <li key={href}>
                <Link href={href} className="group flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-400">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
                    <Icon aria-hidden className="size-4.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2 font-medium">
                      {title}
                      <Arrow aria-hidden className="size-4 text-zinc-400 transition group-hover:text-zinc-700" />
                    </span>
                    <span className="mt-0.5 block text-sm text-zinc-500">{body}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
