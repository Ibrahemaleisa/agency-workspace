import { requireUser } from "@/lib/auth";
import { getT } from "@/lib/lang";
import { GUIDE, type GuideAudience } from "@/content/guide";
import { appUrl, tenantEntryUrl } from "@/lib/platform";
import { getOrgById } from "@/lib/tenant";
import { getSaasT } from "@/lib/i18n-saas";
import { restartTour } from "@/server/onboarding-actions";
import { RestartTour } from "@/components/tour";
import { withBrand } from "@/lib/brand";
import { PageHeader } from "@/components/ui";
import type { Role } from "@/db/schema";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t.guide.title };
}

const visible = (audience: GuideAudience, role: Role) =>
  audience === "all" || (audience === "staff" ? role !== "client" : role === "admin");

export default async function GuidePage() {
  const user = await requireUser();
  const { t, lang, brand } = await getT();
  const { t: st } = await getSaasT();
  const org = await getOrgById(user.orgId);
  const site = (org ? tenantEntryUrl(org) : appUrl()).replace(/^https?:\/\//, "");
  const sections = withBrand(GUIDE[lang], brand.name[lang])
    .filter((s) => visible(s.audience, user.role))
    .map((s) => ({ ...s, html: s.html.replaceAll("{site}", site) }));

  return (
    <>
      <PageHeader title={t.guide.title} description={t.guide.subtitle} />
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200/80 bg-white px-4 py-3">
        <p className="text-sm text-zinc-600">{st.tour.restartHint}</p>
        <RestartTour label={st.tour.restart} persist={!user.readOnly} action={restartTour} />
      </div>
      <div className="grid gap-8 lg:grid-cols-[200px_minmax(0,1fr)]">
        <nav aria-label={t.guide.contents} className="lg:sticky lg:top-20 lg:self-start">
          <p className="mb-2 text-xs font-medium text-zinc-500">{t.guide.contents}</p>
          <ol className="flex flex-wrap gap-1.5 lg:flex-col lg:gap-0.5">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="block rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-600 hover:border-sand-300 hover:text-ink lg:border-0 lg:bg-transparent lg:hover:bg-sand-100"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <article className="guide min-w-0">
          {sections.map((s) => (
            // Static, trusted content shipped with the app (src/content/guide.ts) — no user input.
            <section key={s.id} id={s.id} dangerouslySetInnerHTML={{ __html: s.html }} />
          ))}
        </article>
      </div>
    </>
  );
}
