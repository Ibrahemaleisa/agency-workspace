import { CtaBand } from "@/components/cta-band";
import { PageHero } from "@/components/page-hero";
import { Container, Section, SectionHeader } from "@/components/section";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "About",
  description: "Operra started as the system a working agency built to run itself. Why it exists and the principles behind it.",
  path: "/about",
});

const PRINCIPLES = [
  {
    title: "Built from agency work",
    body: "Operra started as the internal system of a working agency — the stages, approvals and dashboards come from running real client projects, not from a generic task tool.",
  },
  {
    title: "Your brand comes first",
    body: "Your clients sign in to your agency, not to us. The workspace carries your name, logo, colours and domain.",
  },
  {
    title: "Your data stays separate",
    body: "Every agency runs on its own deployment and database. Nothing is shared between customers.",
  },
  {
    title: "Bilingual by design",
    body: "Arabic and English are both first-class, including right-to-left layout and emails in each person’s language.",
  },
  {
    title: "Honest about what it does",
    body: "Everything on this site is in the product today. Screenshots come from the real app with sample data.",
  },
  {
    title: "Opinionated, not rigid",
    body: "A clear structure — client, project, module, task — with workflows and fields you define yourself.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About Operra"
        title="Agencies run on client work. Their tools rarely do."
        lead="Most agencies stitch together a task app, spreadsheets, email threads for approvals and a group chat. Operra puts the whole job — from the client’s brief to the approved delivery — in one system shaped around how agencies actually work."
      />
      <Section tone="white">
        <Container className="grid gap-12 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
          <SectionHeader eyebrow="Why it exists" title="Made by people who run client projects." />
          <div className="space-y-5 text-lg leading-relaxed text-muted">
            <p>
              Operra began inside a creative agency that needed one place to see every client, every project and every
              deliverable — and to stop losing approvals in inboxes. The structure that worked there became the product:
              clients own projects, projects are built from reusable modules, and modules turn into tasks with a clear
              path to the client’s sign‑off.
            </p>
            <p>
              Today every agency on Operra gets that same system as its own branded workspace, with its own database, in
              Arabic or English.
            </p>
          </div>
        </Container>
      </Section>
      <Section labelledBy="principles-title" className="border-t border-line">
        <Container>
          <SectionHeader id="principles-title" eyebrow="Principles" title="What we hold ourselves to." />
          <ul className="mt-12 grid gap-px overflow-hidden rounded-[var(--radius-frame)] border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
            {PRINCIPLES.map((p) => (
              <li key={p.title} className="bg-surface p-7">
                <h3 className="font-medium">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{p.body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>
      <CtaBand />
    </>
  );
}
