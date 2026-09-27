import { CtaBand } from "@/components/cta-band";
import { PageHero } from "@/components/page-hero";
import { Container, Section, SectionHeader } from "@/components/section";
import { getContent } from "@/i18n/server";
import { pageMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";

export async function generateMetadata() {
  const { PAGES, locale } = await getContent();
  return pageMetadata({ title: PAGES.about.metaTitle, description: PAGES.about.metaDescription, path: "/about", locale });
}

const label = "font-mono text-[11px] leading-4 font-medium tracking-[0.08em] uppercase";

/* The name, told in each language (rich text, so it lives here rather than in content). */
function NameStory({ ar }: { ar: boolean }) {
  if (ar) {
    return (
      <div className="space-y-4 text-[17px] leading-[28px] text-muted">
        <p>
          <span lang="en" className="text-ink">
            Opera
          </span>{" "}
          في اللاتينية تعني <em>الأعمال</em> — جمع <span lang="en">opus</span>. وإنتاج الوكالة هو حرفياً «أعمالها»: مجموع ما
          تصنعه. و<span className="text-ink">أوبيرّا</span> هو هذا المجموع من الأعمال، مُداراً.
        </p>
        <p>
          المقطع <span lang="en" className="text-ink">Oper-</span> يحمل معنى <em>التشغيل</em> و<em>العمليات</em>. والـ
          <span lang="en" className="text-ink">
            rr
          </span>{" "}
          المضاعفة مساران يسيران بالتوازي: الوكالة وعملاؤها، الخطة والواقع. تُنطق «أوبيرّا».
        </p>
        <p>
          الشعار مؤشّر حالة: الحلقة هي الدورة من الموجز إلى التسليم — <em>لا شيء يضيع</em> — والنقطة في فتحتها هي العمل وهو
          يتحرك — <em>كل شيء يتحرك</em>.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-4 text-[17px] leading-[26px] text-muted">
      <p>
        <span className="text-ink">Opera</span> is Latin for <em>works</em> — the plural of <em>opus</em>. An agency’s output is
        literally its opera: the body of work. <span className="text-ink">Operra</span> is that body of work, operated.
      </p>
      <p>
        <span className="text-ink">Oper-</span> carries <em>operate</em> and <em>operations</em>. The doubled{" "}
        <span className="text-ink">rr</span> reads as two tracks running in parallel: the agency and its clients, the plan and
        the reality. Said OP-er-ra; in Arabic, <span lang="ar">أوبيرّا</span>.
      </p>
      <p>
        The mark is a status indicator: the ring is the loop from brief to delivery — <em>nothing lost</em> — and the dot in its
        opening is the work in motion — <em>everything moving</em>.
      </p>
    </div>
  );
}

export default async function AboutPage() {
  const { PAGES, locale } = await getContent();
  const t = PAGES.about;
  const ar = locale === "ar";
  return (
    <>
      <PageHero
        marker={t.marker}
        title={t.title}
        lead={t.lead}
      />

      <Section tone="surface" labelledBy="name-title">
        <Container className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <SectionHeader id="name-title" marker={t.nameMarker} index={1} title={t.nameTitle} />
          <NameStory ar={ar} />
        </Container>
      </Section>

      <Section labelledBy="personality-title">
        <Container className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <SectionHeader
            id="personality-title"
            marker={t.personalityMarker}
            index={2}
            title={t.personalityTitle}
            lead={t.personalityLead}
          />
          <table className="w-full border-collapse text-[15px] leading-[22px]">
            <caption className="sr-only">{`${t.is} … ${t.never}`}</caption>
            <thead>
              <tr className="border-b border-line-strong">
                <th scope="col" className={`w-1/2 py-3 text-start ${label}`}>
                  {t.is}
                </th>
                <th scope="col" className={`w-1/2 py-3 text-start text-muted ${label}`}>
                  {t.never}
                </th>
              </tr>
            </thead>
            <tbody>
              {t.personality.map(([is, never]) => (
                <tr key={is} className="border-b border-line">
                  <td className="py-3 font-medium">{is}</td>
                  <td className="py-3 text-muted">{never}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Container>
      </Section>

      <Section tone="surface" labelledBy="principles-title">
        <Container>
          <SectionHeader id="principles-title" marker={t.principlesMarker} index={3} title={t.principlesTitle} />
          <ul className="mt-12 grid gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
            {t.principles.map((p) => (
              <li key={p.title} className="bg-surface p-6">
                <h3 className="text-[15px] leading-[22px] font-semibold">{p.title}</h3>
                <p className="mt-1.5 text-[14px] leading-5 text-muted">{p.body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <CtaBand title={ar ? site.taglineAr : site.tagline} lead={PAGES.home.heroSub} />
    </>
  );
}
