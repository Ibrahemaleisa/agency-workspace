import { Check } from "lucide-react";
import { ButtonLink } from "@/components/button";
import { CtaBand } from "@/components/cta-band";
import { PageHero } from "@/components/page-hero";
import { PlatformGrid } from "@/components/platform-grid";
import { ProductFrame } from "@/components/product-frame";
import { Schematic } from "@/components/schematic";
import { Container, Section, SectionHeader } from "@/components/section";
import { getContent } from "@/i18n/server";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata() {
  const { PAGES, locale } = await getContent();
  return pageMetadata({ title: PAGES.product.metaTitle, description: PAGES.product.metaDescription, path: "/product", locale });
}

const label = "text-[13px] leading-5 font-medium";

export default async function ProductPage() {
  const { PAGES, AUDIENCES, UI } = await getContent();
  const t = PAGES.product;
  const model = t.model.nodes.map((n, i) => ({ ...n, state: i === t.model.nodes.length - 1 ? ("live" as const) : ("done" as const) }));
  return (
    <>
      <PageHero
        marker={t.marker}
        title={t.title}
        lead={t.lead}
      >
        <ProductFrame shot="projectOverview" eager sizes="(min-width: 1200px) 1140px, 100vw" />
      </PageHero>

      <Section tone="surface" labelledBy="model-title">
        <Container>
          <SectionHeader
            id="model-title"
            marker={t.model.marker}
            index={1}
            title={t.model.title}
            lead={t.model.lead}
          />
          <div className="mt-10 rounded-lg border border-line bg-paper p-5 sm:p-6">
            <Schematic nodes={model} label={t.model.label} />
          </div>
          <figure className="mt-12">
            <ProductFrame shot="cropModuleStages" variant="card" sizes="(min-width: 1200px) 1140px, 100vw" />
            <figcaption className="mt-3 text-[13px] leading-[18px] text-muted">{t.model.caption}</figcaption>
          </figure>
        </Container>
      </Section>

      <Section labelledBy="roles-title" id="roles" className="scroll-mt-14">
        <Container>
          <SectionHeader
            id="roles-title"
            marker={t.roles.marker}
            index={2}
            title={t.roles.title}
            lead={t.roles.lead}
          />
          <div className="mt-12 divide-y divide-line border-y border-line">
            {AUDIENCES.map((a) => (
              <article key={a.id} className="grid gap-6 py-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,4fr)_minmax(0,4fr)] lg:gap-10">
                <div>
                  <p className={`text-muted ${label}`}>{a.audience}</p>
                  <h3 className="mt-2 text-[24px] leading-[30px] font-semibold tracking-[-0.015em]">{a.who}</h3>
                  <p className="mt-2 text-[15px] leading-[22px] text-muted">{a.wants}</p>
                  <p className="mt-4 inline-flex items-center gap-1.5 rounded-xs border border-line bg-surface px-2 py-0.5 text-[12px] leading-[18px]">
                    <span className="text-muted">{UI.role}</span>
                    <span className="font-medium">{a.productRole}</span>
                  </p>
                </div>
                <ul className="divide-y divide-line self-start border-y border-line">
                  {a.does.map((d) => (
                    <li key={d} className="flex gap-3 py-2.5 text-[14px] leading-5">
                      <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-ink" />
                      {d}
                    </li>
                  ))}
                </ul>
                <ProductFrame shot={a.shot} sizes="(min-width: 1024px) 370px, 100vw" />
              </article>
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="surface" labelledBy="mobile-title">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <SectionHeader
              id="mobile-title"
              marker={t.mobile.marker}
              index={3}
              title={t.mobile.title}
              lead={t.mobile.lead}
            />
            <div className="mx-auto grid max-w-md grid-cols-2 gap-4 sm:gap-6">
              <ProductFrame shot="mobileDashboard" variant="card" className="rounded-xl" sizes="(min-width: 640px) 220px, 45vw" />
              <ProductFrame shot="mobileProject" variant="card" className="mt-10 rounded-xl" sizes="(min-width: 640px) 220px, 45vw" />
            </div>
          </div>
        </Container>
      </Section>

      <Section labelledBy="setup-title">
        <Container>
          <SectionHeader
            id="setup-title"
            marker={t.setup.marker}
            index={4}
            title={t.setup.title}
            lead={t.setup.lead}
          />
          <ol className="mt-12 grid gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-2 lg:grid-cols-4">
            {t.setup.steps.map((s, i) => (
              <li key={s.title} className="bg-surface p-6">
                <p className={`text-muted ${label}`}>{String(i + 1).padStart(2, "0")}</p>
                <h3 className="mt-3 text-[15px] leading-[22px] font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-[14px] leading-5 text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
          <div className="mt-12">
            <PlatformGrid />
          </div>
          <div className="mt-8">
            <ButtonLink href="/features" variant="secondary" arrow>
              {t.setup.more}
            </ButtonLink>
          </div>
        </Container>
      </Section>

      <CtaBand />
    </>
  );
}
