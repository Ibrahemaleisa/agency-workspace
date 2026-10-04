import { requireUser } from "@/lib/auth";
import { getT } from "@/lib/lang";
import { changeOwnPassword } from "@/server/auth-actions";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Card, Field, Input, PageHeader } from "@/components/ui";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t.account.title };
}

export default async function AccountPage() {
  const user = await requireUser();
  const { t } = await getT();
  const a = t.account;

  return (
    <>
      <PageHeader title={a.title} description={a.description} />
      <div className="grid max-w-3xl gap-6">
        <Card title={a.details}>
          <dl className="grid gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs font-medium text-zinc-500">{a.name}</dt>
              <dd className="mt-1 font-medium">{user.name}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs font-medium text-zinc-500">{a.email}</dt>
              <dd className="mt-1 truncate">
                <bdi dir="ltr">{user.email}</bdi>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">{a.role}</dt>
              <dd className="mt-1">{t.roles[user.role]}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-zinc-400">{a.detailsHint}</p>
        </Card>

        <Card title={a.passwordTitle}>
          <ActionForm action={changeOwnPassword} successMessage={a.saved} resetOnSuccess className="space-y-4">
            <p className="text-xs text-zinc-500">{a.passwordHint}</p>
            <Field label={a.current}>
              <Input name="current" type="password" autoComplete="current-password" required dir="ltr" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={a.next} hint={t.actions.passwordLength}>
                <Input name="next" type="password" autoComplete="new-password" minLength={8} required dir="ltr" />
              </Field>
              <Field label={a.confirm}>
                <Input name="confirm" type="password" autoComplete="new-password" minLength={8} required dir="ltr" />
              </Field>
            </div>
            <SubmitButton>{a.save}</SubmitButton>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
