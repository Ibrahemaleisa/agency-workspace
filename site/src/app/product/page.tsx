import { Check } from "lucide-react";
import { ButtonLink } from "@/components/button";
import { CtaBand } from "@/components/cta-band";
import { PageHero } from "@/components/page-hero";
import { PlatformGrid } from "@/components/platform-grid";
import { ProductFrame } from "@/components/product-frame";
import { Schematic } from "@/components/schematic";
import { Container, Section, SectionHeader } from "@/components/section";
import { AUDIENCES } from "@/content/roles";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Product overview",
  description:
    "How Operra is structured: clients, projects, reusable modules and tasks; a role for everyone from founders to clients; and a dedicated branded workspace for every agency.",
  path: "/product",
});

const MODEL = [
  { label: "Agency", note: "Your workspace: team, brand, templates.", state: "done" as const },
  { label: "Clients", note: "Contacts, internal notes, team, portal logins.", state: "done" as const },
  { label: "Projects", note: "Dates, status, owner, team. Progress from tasks.", state: "done" as const },
  { label: "Modules", note: "Reusable workflows: stages and fields.", state: "done" as const },
  { label: "Tasks", note: "One per stage to start. Assigned, dated, discussed.", state: "live" as const },
];

const ONBOARDING = [
  { title: "We set up your workspace", body: "A dedicated deployment and database for your agency. You receive the admin sign-in." },
  { title: "Make it yours", body: "Name, logo and colours in Settings → Brand — and your own domain, if you want one." },
  { title: "Add your team and clients", body: "Invite staff in Team & Users, create client profiles and their portal accounts." },
  { title: "Tune your workflows", body: "Adjust the starter module templates so stages and fields match how you work." },
];

const label = "font-mono text-[11px] leading-4 font-medium tracking-[0.08em] uppercase";

export default function ProductPage() {
  return (
    <>
      <PageHero
        marker="Product overview"
        title="One system of record for the work itself"
        lead="Generic tools know what a task is. Operra knows clients, projects, stages and sign‑off — so the agency stops bending tools into shape and drifting back to the thread."
      >
        <ProductFrame shot="projectOverview" eager sizes="(min-width: 1200px) 1140px, 100vw" />
      </PageHero>

      <Section tone="surface" labelledBy="model-title">
        <Container>
          <SectionHeader
            id="model-title"
            marker="The model"
            index={1}
            title="Everything hangs off the client"
            lead="Five levels, each with one job. Every client works the same way, so anyone can find their way around any project."
          />
          <div className="mt-10 rounded-lg border border-line bg-paper p-5 sm:p-6">
            <Schematic nodes={MODEL} label="Operra’s structure, from agency to task" />
          </div>
          <figure className="mt-12">
            <ProductFrame shot="cropModuleStages" variant="card" sizes="(min-width: 1200px) 1140px, 100vw" />
            <figcaption className="mt-3 text-[13px] leading-[18px] text-muted">
              A Content module on a project. Each stage is a task; the current stage is highlighted, and the dot marks the
              stage that goes to the client for approval.
            </figcaption>
          </figure>
        </Container>
      </Section>

      <Section labelledBy="roles-title" id="roles" className="scroll-mt-14">
        <Container>
          <SectionHeader
            id="roles-title"
            marker="Roles"
            index={2}
            title="Every seat in the agency, one permission system"
            lead="Three roles — Admin, Team member and Client — enforced centrally. Buttons someone can’t use don’t appear, and clients never see anything internal."
          />
          <div className="mt-12 divide-y divide-line border-y border-line">
            {AUDIENCES.map((a) => (
              <article key={a.id} className="grid gap-6 py-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,4fr)_minmax(0,4fr)] lg:gap-10">
                <div>
                  <p className={`text-muted ${label}`}>{a.audience}</p>
                  <h3 className="mt-2 text-[24px] leading-[30px] font-semibold tracking-[-0.015em]">{a.who}</h3>
                  <p className="mt-2 text-[15px] leading-[22px] text-muted">{a.wants}</p>
                  <p className="mt-4 inline-flex items-center gap-1.5 rounded-xs border border-line bg-surface px-2 py-0.5 text-[12px] leading-[18px]">
                    <span className="text-muted">Role</span>
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
              marker="On any screen"
              index={3}
              title="The same workspace on your phone"
              lead="A bottom navigation bar on small screens, so approvals, status changes and chat don’t wait for a laptop."
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
            marker="Getting started"
            index={4}
            title="A workspace of your own, not a shared account"
            lead="Operra isn’t one big app with every agency inside it. Each agency runs on its own deployment and database."
          />
          <ol className="mt-12 grid gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-2 lg:grid-cols-4">
            {ONBOARDING.map((s, i) => (
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
              See every feature
            </ButtonLink>
          </div>
        </Container>
      </Section>

      <CtaBand />
    </>
  );
}
