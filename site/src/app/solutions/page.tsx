import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CtaBand } from "@/components/cta-band";
import { Icon } from "@/components/icon";
import { PageHero } from "@/components/page-hero";
import { Container, Section } from "@/components/section";
import { StageChain } from "@/components/stage-chain";
import { SOLUTIONS } from "@/content/solutions";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Solutions by agency type",
  description:
    "How content and social agencies, production studios, performance marketing teams and full-service agencies run their work in Operra.",
  path: "/solutions",
});

export default function SolutionsPage() {
  return (
    <>
      <PageHero
        eyebrow="Solutions"
        title="Built for the way your kind of agency works."
        lead="Every workspace starts with module templates for common agency disciplines. Use them as they are, edit them, or build your own."
      />
      <Section tone="white">
        <Container>
          <ul className="grid gap-6 lg:grid-cols-2">
            {SOLUTIONS.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/solutions/${s.slug}`}
                  className="group flex h-full flex-col rounded-[var(--radius-frame)] border border-line bg-paper p-7 transition-colors hover:border-ink/20 sm:p-8"
                >
                  <Icon name={s.icon} className="size-6 text-sand-deep" />
                  <h2 className="mt-5 text-2xl font-semibold tracking-[-0.03em]">{s.name}</h2>
                  <p className="mt-3 leading-relaxed text-muted">{s.summary}</p>
                  <div className="mt-6 border-t border-line pt-6">
                    <p className="mb-3 text-xs font-medium tracking-wide text-subtle uppercase">{s.module.name} module</p>
                    <StageChain stages={s.module.stages} size="sm" />
                  </div>
                  <span className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium">
                    How it runs
                    <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </Section>
      <CtaBand />
    </>
  );
}
