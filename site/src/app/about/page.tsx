import { CtaBand } from "@/components/cta-band";
import { PageHero } from "@/components/page-hero";
import { Container, Section, SectionHeader } from "@/components/section";
import { pageMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";

export const metadata = pageMetadata({
  title: "About",
  description: "Why Operra exists, what the name means, and the principles behind the operating system for agencies.",
  path: "/about",
});

const label = "font-mono text-[11px] leading-4 font-medium tracking-[0.08em] uppercase";

/* From the brand personality: Operra is … but never … */
const PERSONALITY: [string, string][] = [
  ["Precise", "Cold"],
  ["Confident", "Loud"],
  ["Fast", "Rushed"],
  ["Premium", "Exclusive"],
  ["Simple", "Simplistic"],
  ["Operational", "Bureaucratic"],
  ["Locally fluent", "Localised as an afterthought"],
];

const PRINCIPLES = [
  { title: "Built from agency work", body: "Operra started as the internal system of a working agency. Its stages, approvals and dashboards come from running real client projects." },
  { title: "Your brand leads", body: "Clients sign in to your agency, not to us. The workspace carries your name, logo, colours and domain." },
  { title: "Your data stays separate", body: "Every agency runs on its own deployment and database. Nothing is shared between customers." },
  { title: "Arabic is written, not translated", body: "Arabic and English are both first-class, with a native right-to-left layout and emails in each person’s language." },
  { title: "Only what ships", body: "Everything on this site is in the product today. Screenshots come from the real app with sample data." },
  { title: "Numbers over adjectives", body: "“3 approvals waiting” beats “streamlined approvals”. Short sentences, no exclamation marks." },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        marker="About Operra"
        title="Agencies don’t lack tools. They lack a system of record for the work"
        lead="Most agencies run the business through a chat group per client, a sheet per retainer and a shared drive nobody trusts. The work gets done; the operation is invisible. Operra is the place the agency actually runs."
      />

      <Section tone="surface" labelledBy="name-title">
        <Container className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <SectionHeader id="name-title" marker="The name" index={1} title="The body of work, operated" />
          <div className="space-y-4 text-[17px] leading-[26px] text-muted">
            <p>
              <span className="text-ink">Opera</span> is Latin for <em>works</em> — the plural of <em>opus</em>. An agency’s
              output is literally its opera: the body of work. <span className="text-ink">Operra</span> is that body of work,
              operated.
            </p>
            <p>
              <span className="text-ink">Oper-</span> carries <em>operate</em> and <em>operations</em>. The doubled{" "}
              <span className="text-ink">rr</span> reads as two tracks running in parallel: the agency and its clients, the plan
              and the reality. Said OP-er-ra; in Arabic, <span lang="ar">أوبيرّا</span>.
            </p>
            <p>
              The mark is a status indicator: the ring is the loop from brief to delivery — <em>nothing lost</em> — and the dot
              in its opening is the work in motion — <em>everything moving</em>.
            </p>
          </div>
        </Container>
      </Section>

      <Section labelledBy="personality-title">
        <Container className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <SectionHeader
            id="personality-title"
            marker="Personality"
            index={2}
            title="The calm person in the control room"
            lead="Knows where everything is, never raises their voice, makes the hard thing look simple."
          />
          <table className="w-full border-collapse text-[15px] leading-[22px]">
            <caption className="sr-only">Operra is … but never …</caption>
            <thead>
              <tr className="border-b border-line-strong">
                <th scope="col" className={`w-1/2 py-3 text-start ${label}`}>
                  Operra is
                </th>
                <th scope="col" className={`w-1/2 py-3 text-start text-muted ${label}`}>
                  …but never
                </th>
              </tr>
            </thead>
            <tbody>
              {PERSONALITY.map(([is, never]) => (
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
          <SectionHeader id="principles-title" marker="Principles" index={3} title="What we hold ourselves to" />
          <ul className="mt-12 grid gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
            {PRINCIPLES.map((p) => (
              <li key={p.title} className="bg-surface p-6">
                <h3 className="text-[15px] leading-[22px] font-semibold">{p.title}</h3>
                <p className="mt-1.5 text-[14px] leading-5 text-muted">{p.body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <CtaBand title={site.tagline} lead="Run the whole agency in one place — from brief to client sign‑off." />
    </>
  );
}
