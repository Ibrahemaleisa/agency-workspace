import { site } from "@/lib/site";
import { ButtonLink } from "./button";
import { LiveO } from "./logo";
import { Container } from "./section";

/** Closing panel band. The Live O sits cropped off the trailing edge, as on deck covers. */
export function CtaBand({
  title = "Run the whole agency in one place",
  lead = "Start a free trial with your own branded workspace, or open the live demo agency first.",
}: {
  title?: string;
  lead?: string;
}) {
  return (
    <section aria-labelledby="cta-title" className="relative overflow-hidden bg-panel py-20 text-on-panel sm:py-28">
      <LiveO tone="panel-graphic" className="pointer-events-none absolute -end-56 top-1/2 hidden size-[560px] -translate-y-1/2 md:block lg:-end-24" />
      <Container className="relative">
        <p className="font-mono text-[11px] leading-4 font-medium tracking-[0.08em] text-on-panel-muted uppercase">{site.tagline}</p>
        <h2 id="cta-title" className="mt-4 max-w-2xl text-[32px] leading-[38px] font-semibold tracking-[-0.025em] sm:text-[48px] sm:leading-[52px] sm:tracking-[-0.03em]">
          {title}
        </h2>
        <p className="mt-4 max-w-xl text-[17px] leading-[26px] text-on-panel-muted">{lead}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/start" variant="on-panel" size="lg" arrow>
            Start free trial
          </ButtonLink>
          <ButtonLink href={site.demoUrl} variant="on-panel-secondary" size="lg" external>
            Open the live demo
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
