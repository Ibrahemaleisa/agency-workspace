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
        marker="Solutions"
        title="Built for the way your kind of agency works"
        lead="Every workspace starts with module templates for common agency disciplines. Use them as they are, edit them, or build your own."
      />
      <Section tone="surface">
        <Container>
          <ul className="grid gap-px overflow-hidden rounded-lg border border-line bg-line lg:grid-cols-2">
            {SOLUTIONS.map((s, i) => (
              <li key={s.slug} className="bg-surface">
                <Link href={`/solutions/${s.slug}`} className="group flex h-full flex-col p-6 transition-colors hover:bg-paper sm:p-8">
                  <p className="flex items-center gap-2 font-mono text-[11px] leading-4 font-medium tracking-[0.08em] text-muted uppercase">
                    <Icon name={s.icon} className="size-4 text-ink" />
                    {String(i + 1).padStart(2, "0")} — {s.module.name} module
                  </p>
                  <h2 className="mt-4 text-[24px] leading-[30px] font-semibold tracking-[-0.015em]">{s.name}</h2>
                  <p className="mt-2 text-[15px] leading-[22px] text-muted">{s.summary}</p>
                  <div className="mt-6 border-t border-line pt-6">
                    <StageChain stages={s.module.stages} size="sm" />
                  </div>
                  <span className="mt-8 inline-flex items-center gap-1.5 text-[14px] font-medium">
                    How it runs
                    <ArrowRight aria-hidden className="size-4" />
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
