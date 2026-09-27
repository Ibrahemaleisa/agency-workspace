import { requirePermission } from "@/lib/auth";
import { getT } from "@/lib/lang";
import { updateBrand } from "@/server/brand-actions";
import { ActionForm, SubmitButton } from "@/components/forms";
import { BrandColors } from "@/components/brand-colors";
import { BrandMark } from "@/components/site/brand";
import { Card, Checkbox, FILE_INPUT, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t.brandSettings.title };
}

export default async function BrandSettingsPage() {
  await requirePermission("brand.manage");
  const { t, brand, lang } = await getT();
  const b = t.brandSettings;

  return (
    <>
      <PageHeader title={b.title} description={b.subtitle} />
      <ActionForm action={updateBrand} successMessage={b.saved} className="space-y-6">
        <Card title={b.identity}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={b.nameEn}>
              <Input name="name" defaultValue={brand.name.en} required dir="ltr" />
            </Field>
            <Field label={b.nameAr} hint={b.nameArHint}>
              <Input name="nameAr" defaultValue={brand.name.ar === brand.name.en ? "" : brand.name.ar} dir="rtl" />
            </Field>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-5">
            <div className="flex size-20 items-center justify-center rounded-xl border border-zinc-200 bg-ink p-2">
              <BrandMark logo={brand.logo} name={brand.name[lang]} className="h-12 max-w-full" />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <Field label={b.logo} hint={b.logoHint}>
                <input type="file" name="logo" accept="image/png,image/jpeg,image/webp,image/svg+xml" className={FILE_INPUT} />
              </Field>
              {brand.logo && <Checkbox name="removeLogo" label={b.removeLogo} />}
            </div>
          </div>
        </Card>

        <Card title={b.colors}>
          <BrandColors
            primary={brand.primary}
            accent={brand.accent}
            name={brand.name[lang]}
            labels={{
              primary: b.primary,
              primaryHint: b.primaryHint,
              accent: b.accent,
              accentHint: b.accentHint,
              preview: b.preview,
              button: b.previewButton,
              badge: b.previewBadge,
            }}
          />
        </Card>

        <Card title={b.language}>
          <Field label={b.defaultLang} hint={b.defaultLangHint} className="max-w-xs">
            <Select
              name="defaultLang"
              defaultValue={brand.defaultLang}
              options={[
                { value: "ar", label: "العربية" },
                { value: "en", label: "English" },
              ]}
            />
          </Field>
        </Card>

        <Card title={b.publicSite}>
          <Checkbox name="showLanding" defaultChecked={brand.showLanding} label={b.showLanding} />
          <p className="mt-1 ms-6 text-xs text-zinc-500">{b.showLandingHint}</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label={b.contactEmail}>
              <Input name="contactEmail" type="email" defaultValue={brand.contactEmail} dir="ltr" />
            </Field>
            <Field label={b.whatsapp} hint={b.whatsappHint}>
              <Input name="whatsapp" defaultValue={brand.whatsapp} dir="ltr" inputMode="tel" />
            </Field>
            <Field label="Instagram">
              <Input name="instagram" defaultValue={brand.social.instagram} dir="ltr" placeholder="https://instagram.com/…" />
            </Field>
            <Field label="X">
              <Input name="x" defaultValue={brand.social.x} dir="ltr" placeholder="https://x.com/…" />
            </Field>
            <Field label="LinkedIn" className="sm:col-span-2">
              <Input name="linkedin" defaultValue={brand.social.linkedin} dir="ltr" placeholder="https://linkedin.com/company/…" />
            </Field>
            <Field label={b.showcase} hint={b.showcaseHint} className="sm:col-span-2">
              <Textarea name="showcaseClients" rows={3} defaultValue={brand.showcaseClients.join("\n")} />
            </Field>
          </div>
        </Card>

        <div className="flex justify-end">
          <SubmitButton>{b.save}</SubmitButton>
        </div>
      </ActionForm>
    </>
  );
}
