import { ButtonLink } from "@/components/button";
import { Container } from "@/components/section";

export default function NotFound() {
  return (
    <div className="bg-paper py-28 sm:py-40">
      <Container className="text-center">
        <p className="font-mono text-sm text-subtle">404</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">This page doesn’t exist.</h1>
        <p className="mx-auto mt-4 max-w-md text-lg text-muted">
          Looking for your agency’s workspace? It lives at its own address — use Log in to get there.
        </p>
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
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
