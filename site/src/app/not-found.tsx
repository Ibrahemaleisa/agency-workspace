import { ButtonLink } from "@/components/button";
import { LiveO } from "@/components/logo";
import { Container } from "@/components/section";

export default function NotFound() {
  return (
    <div className="bg-paper py-24 sm:py-32">
      <Container>
        <LiveO className="size-10" />
        <p className="mt-8 font-mono text-[11px] leading-4 font-medium tracking-[0.08em] text-muted uppercase">404 — Not found</p>
        <h1 className="mt-4 text-[32px] leading-[38px] font-semibold tracking-[-0.02em] sm:text-[48px] sm:leading-[52px]">
          This page doesn’t exist
        </h1>
        <p className="mt-4 max-w-md text-[17px] leading-[26px] text-muted">
          Looking for your agency’s workspace? It lives at its own address. Log in to get there.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/" size="lg">
            Back to home
          </ButtonLink>
          <ButtonLink href="/login" size="lg" variant="secondary">
            Log in
          </ButtonLink>
        </div>
      </Container>
    </div>
  );
}
