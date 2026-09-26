import { ExternalLink } from "lucide-react";
import { ButtonLink } from "@/components/button";
import { CtaBand } from "@/components/cta-band";
import { PageHero } from "@/components/page-hero";
import { ProductFrame } from "@/components/product-frame";
import { Reveal } from "@/components/reveal";
import { Container, Section, SectionHeader } from "@/components/section";
import { WorkflowSection } from "@/components/workflow-section";
import { pageMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Interactive demo",
  description:
    "Walk through Operra step by step — client, project, module, task, review, approval, delivery — then sign in to the live demo agency as an admin, team member or client.",
  path: "/demo",
});

const VIEWS = [
  { title: "As an admin", shot: "dashboard", body: "The whole agency: counts, project health, workload and activity." },
  { title: "As a team member", shot: "employeeDashboard", body: "Their own tasks: due today, overdue, and work waiting on them." },
  { title: "As a client", shot: "clientApprovals", body: "Only their projects, and everything waiting for their sign‑off." },
] as const;

export default function DemoPage() {
  return (
    <>
      <PageHero
        eyebrow="Interactive demo"
        title="Walk through a real project."
        lead="Follow one job at a sample agency, Northwind Studio, from the client’s profile to approved delivery. Use the steps or your arrow keys."
      />

      <Section tone="white" className="pt-14 sm:pt-16" labelledBy="tour-title">
        <Container>
          <h2 id="tour-title" className="sr-only">
            Workflow tour
          </h2>
          <WorkflowSection />
        </Container>
      </Section>

      <Section labelledBy="live-title" className="border-t border-line">
        <Container>
          <div className="grid gap-10 rounded-[calc(var(--radius-frame)+6px)] border border-line bg-surface p-7 sm:p-10 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-16">
            <div>
              <SectionHeader
                id="live-title"
                eyebrow="Live demo"
                title="Now try it yourself."
                lead="The demo workspace is a real Operra deployment with sample data. Sign in with any account below — each role sees a different workspace."
              />
              <div className="mt-8">
                <ButtonLink href={site.demoUrl} size="lg" external>
                  Open the live demo
                  <ExternalLink aria-hidden className="size-4" />
                </ButtonLink>
              </div>
              <p className="mt-4 text-sm text-subtle">
                It’s shared with other visitors, so please don’t enter anything private.
              </p>
            </div>
            <div className="rounded-[var(--radius-frame)] border border-line bg-paper p-6">
              <h3 className="text-sm font-medium">Demo sign-ins</h3>
              <dl className="mt-4 divide-y divide-line">
                {site.demoAccounts.map((a) => (
                  <div key={a.email} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3">
                    <dt className="text-sm text-muted">{a.role}</dt>
                    <dd className="font-mono text-sm">{a.email}</dd>
                  </div>
                ))}
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3">
                  <dt className="text-sm text-muted">Password (all)</dt>
                  <dd className="font-mono text-sm">{site.demoPassword}</dd>
                </div>
              </dl>
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="white" labelledBy="views-title" className="border-t border-line">
        <Container>
          <SectionHeader id="views-title" eyebrow="Three views" title="One workspace, a different view for each role." />
          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            {VIEWS.map((v, i) => (
              <Reveal key={v.title} delay={i * 80}>
                <ProductFrame shot={v.shot} sizes="(min-width: 1024px) 370px, 100vw" />
                <h3 className="mt-5 font-medium">{v.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{v.body}</p>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <CtaBand title="Ready to see it with your own clients?" />
    </>
  );
}
