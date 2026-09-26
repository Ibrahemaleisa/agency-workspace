import { Check } from "lucide-react";
import { CtaBand } from "@/components/cta-band";
import { PageHero } from "@/components/page-hero";
import { PlatformGrid } from "@/components/platform-grid";
import { ProductFrame } from "@/components/product-frame";
import { ButtonLink } from "@/components/button";
import { Reveal } from "@/components/reveal";
import { Container, Section, SectionHeader } from "@/components/section";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Product overview",
  description:
    "How Operra is structured: clients, projects, reusable modules and tasks, three roles with their own dashboards, and a dedicated branded workspace for every agency.",
  path: "/product",
});

const MODEL = [
  { name: "Agency", body: "Your workspace: team, brand, templates and settings." },
  { name: "Clients", body: "Profiles with contacts, internal notes, assigned team and portal logins." },
  { name: "Projects", body: "Dates, status, owner and team. Progress comes from the tasks." },
  { name: "Modules", body: "Reusable workflows — stages and fields — added to a project." },
  { name: "Tasks", body: "One per stage to start, plus any you add. Assigned, dated, discussed." },
];

const ROLES = [
  {
    name: "Admin",
    who: "Owners, managers, operations",
    can: [
      "Manage the team, clients, projects and templates",
      "Assign work to anyone and filter tasks by person",
      "See the whole agency: health matrix, workload, activity log",
      "Handle leads and the brand settings",
    ],
  },
  {
    name: "Team member",
    who: "Designers, writers, producers, media buyers",
    can: [
      "See the projects they’re on",
      "Create tasks, update status, comment and upload files",
      "Share work with the client and request approval",
      "Use project chat and team chat",
    ],
  },
  {
    name: "Client",
    who: "The people you do the work for",
    can: [
      "See only their own projects",
      "See the tasks and files you share",
      "Approve or request changes with feedback",
      "Talk to your team in the client channel",
    ],
  },
];

const ONBOARDING = [
  { title: "We set up your workspace", body: "A dedicated deployment and database for your agency. You receive the admin sign-in." },
  { title: "Make it yours", body: "Add your name, logo and colours in Settings → Brand, and optionally your own domain." },
  { title: "Add your team and clients", body: "Invite staff in Team & Users, create client profiles and their portal accounts." },
  { title: "Tune your workflows", body: "Adjust the starter module templates so stages and fields match how you work." },
];

export default function ProductPage() {
  return (
    <>
      <PageHero
        eyebrow="Product overview"
        title="One system for the way agencies actually work."
        lead="Operra replaces the spreadsheet, the task app, the approval emails and the group chat with one workspace built around clients and projects."
      >
        <ProductFrame shot="projectOverview" eager sizes="(min-width: 1200px) 1140px, 100vw" />
      </PageHero>

      <Section tone="white" labelledBy="model-title">
        <Container>
          <SectionHeader
            id="model-title"
            eyebrow="The structure"
            title="Everything hangs off the client."
            lead="Five levels, each with a clear job. It’s the same structure for every client, so anyone on the team can find their way around any project."
          />
          <ol className="mt-12 grid gap-px overflow-hidden rounded-[var(--radius-frame)] border border-line bg-line md:grid-cols-5">
            {MODEL.map((m, i) => (
              <li key={m.name} className="relative bg-surface p-6">
                <span className="font-mono text-xs text-subtle tabular-nums">0{i + 1}</span>
                <h3 className="mt-3 text-lg font-semibold tracking-tight">{m.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{m.body}</p>
              </li>
            ))}
          </ol>
          <Reveal className="mt-12">
            <ProductFrame shot="cropModuleStages" variant="card" sizes="(min-width: 1200px) 1140px, 100vw" />
            <p className="mt-4 text-sm text-muted">
              A Content module on a project: each stage is a task, the current stage is highlighted, and the orange dot
              marks the stage that goes to the client for approval.
            </p>
          </Reveal>
        </Container>
      </Section>

      <Section labelledBy="roles-title">
        <Container>
          <SectionHeader
            id="roles-title"
            eyebrow="Roles"
            title="Three roles. Each sees exactly what it should."
            lead="Permissions are enforced centrally. Buttons someone can’t use simply don’t appear — and clients never see anything internal."
          />
          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {ROLES.map((r) => (
              <article key={r.name} className="rounded-[var(--radius-frame)] border border-line bg-surface p-7">
                <h3 className="text-xl font-semibold tracking-tight">{r.name}</h3>
                <p className="mt-1 text-sm text-subtle">{r.who}</p>
                <ul className="mt-6 space-y-3">
                  {r.can.map((c) => (
                    <li key={c} className="flex gap-3 text-[0.95rem]">
                      <Check aria-hidden className="mt-1 size-4 shrink-0 text-sand-deep" strokeWidth={2.25} />
                      {c}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <Reveal>
              <p className="mb-3 text-sm font-medium text-muted">Admin dashboard</p>
              <ProductFrame shot="dashboard" sizes="(min-width: 1024px) 570px, 100vw" />
            </Reveal>
            <Reveal delay={100}>
              <p className="mb-3 text-sm font-medium text-muted">Client dashboard</p>
              <ProductFrame shot="clientDashboard" sizes="(min-width: 1024px) 570px, 100vw" />
            </Reveal>
          </div>
        </Container>
      </Section>

      <Section tone="white" labelledBy="mobile-title" className="border-y border-line">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <SectionHeader
              id="mobile-title"
              eyebrow="On any screen"
              title="The same workspace on your phone."
              lead="Operra adapts to small screens with a bottom navigation bar, so approvals, status changes and chat don’t have to wait for a laptop."
            />
            <div className="mx-auto grid max-w-md grid-cols-2 gap-4 sm:gap-6">
              <ProductFrame shot="mobileDashboard" variant="card" className="rounded-[22px]" sizes="(min-width: 640px) 220px, 45vw" />
              <ProductFrame
                shot="mobileProject"
                variant="card"
                className="mt-10 rounded-[22px]"
                sizes="(min-width: 640px) 220px, 45vw"
              />
            </div>
          </div>
        </Container>
      </Section>

      <Section labelledBy="setup-title">
        <Container>
          <SectionHeader
            id="setup-title"
            eyebrow="Getting started"
            title="A workspace of your own, not a shared account."
            lead="Operra isn’t one big app with every agency inside it. Each agency runs on its own deployment and database."
          />
          <ol className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {ONBOARDING.map((s, i) => (
              <li key={s.title} className="rounded-[var(--radius-frame)] border border-line bg-surface p-6">
                <span className="grid size-8 place-items-center rounded-full bg-ink text-sm font-medium text-sand tabular-nums">
                  {i + 1}
                </span>
                <h3 className="mt-5 font-medium">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
          <div className="mt-16">
            <PlatformGrid />
          </div>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
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
