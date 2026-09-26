import { ExternalLink } from "lucide-react";
import { ButtonLink } from "@/components/button";
import { CtaBand } from "@/components/cta-band";
import { PageHero } from "@/components/page-hero";
import { ProductFrame } from "@/components/product-frame";
import { Container, Section, SectionHeader } from "@/components/section";
import { WorkflowSection } from "@/components/workflow-section";
import { AUDIENCES } from "@/content/roles";
import { pageMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Interactive demo",
  description:
    "Walk through Operra step by step — client, project, module, task, review, approval, delivery — then sign in to the live demo agency as an admin, team member or client.",
  path: "/demo",
});

const label = "font-mono text-[11px] leading-4 font-medium tracking-[0.08em] uppercase";

/* One view per product role: the buyer's admin dashboard, a daily user's, and a guest's. */
const VIEWS = AUDIENCES.filter((a) => a.id !== "champion");

export default function DemoPage() {
  return (
    <>
      <PageHero
        marker="Interactive demo"
        title="Walk through a real project"
        lead="Follow one job at a sample agency, Northwind Studio, from the client’s profile to approved delivery. Use the steps or your arrow keys."
      />

      <Section tone="surface" className="pt-12 sm:pt-14" labelledBy="tour-title">
        <Container>
          <h2 id="tour-title" className="sr-only">
            Workflow tour
          </h2>
          <WorkflowSection />
        </Container>
      </Section>

      <Section labelledBy="live-title">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-16">
            <div>
              <SectionHeader
                id="live-title"
                marker="Live demo"
                index={1}
                title="Now try it yourself"
                lead="The demo workspace is a real Operra deployment with sample data. Sign in with any account — each role sees a different workspace."
              />
              <div className="mt-8">
                <ButtonLink href={site.demoUrl} size="lg" external>
                  Open the live demo
                  <ExternalLink aria-hidden className="size-4" />
                </ButtonLink>
              </div>
              <p className="mt-4 text-[13px] leading-[18px] text-muted">It’s shared with other visitors, so don’t enter anything private.</p>
            </div>
            <div className="self-start rounded-lg border border-line bg-surface">
              <h3 className={`border-b border-line px-5 py-3 text-muted ${label}`}>Demo sign-ins</h3>
              <dl className="divide-y divide-line px-5">
                {site.demoAccounts.map((a) => (
                  <div key={a.email} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3">
                    <dt className="text-[14px] text-muted">{a.role}</dt>
                    <dd className="font-mono text-[13px]">{a.email}</dd>
                  </div>
                ))}
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3">
                  <dt className="text-[14px] text-muted">Password (all)</dt>
                  <dd className="font-mono text-[13px]">{site.demoPassword}</dd>
                </div>
              </dl>
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="surface" labelledBy="views-title">
        <Container>
          <SectionHeader id="views-title" marker="Three roles" index={2} title="One workspace, a different view for each role" />
          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            {VIEWS.map((v) => (
              <figure key={v.id}>
                <ProductFrame shot={v.shot} sizes="(min-width: 1024px) 370px, 100vw" />
                <figcaption className="mt-4">
                  <p className={`text-muted ${label}`}>{v.productRole}</p>
                  <p className="mt-1.5 text-[15px] leading-[22px] font-semibold">{v.who}</p>
                  <p className="mt-1 text-[14px] leading-5 text-muted">{v.does[0]}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </Container>
      </Section>

      <CtaBand title="See it with your own clients" />
    </>
  );
}
