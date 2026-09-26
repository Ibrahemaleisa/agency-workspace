import { site } from "@/lib/site";
import { ButtonLink } from "./button";
import { Container } from "./section";

export function CtaBand({
  title = "Run your agency on one system.",
  lead = "Start a free trial with your own branded workspace, or explore the live demo agency first.",
}: {
  title?: string;
  lead?: string;
}) {
  return (
    <section aria-labelledby="cta-title" className="relative overflow-hidden bg-ink py-24 text-white sm:py-32">
      <div aria-hidden className="grid-lines absolute inset-0" />
      <Container className="relative text-center">
        <h2 id="cta-title" className="mx-auto max-w-2xl text-[2.25rem] leading-[1.08] font-semibold tracking-[-0.035em] sm:text-5xl">
          {title}
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-white/60">{lead}</p>
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/start" variant="light" size="lg" arrow>
            Start free trial
          </ButtonLink>
          <ButtonLink href={site.demoUrl} variant="ghost-light" size="lg" external>
            Open the live demo
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
