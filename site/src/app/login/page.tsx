import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Container } from "@/components/section";
import { WorkspaceLogin } from "@/components/workspace-login";
import { pageMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Log in",
  description: "Sign in to your agency’s Operra workspace.",
  path: "/login",
});

export default function LoginPage() {
  return (
    <div className="bg-paper py-20 sm:py-28">
      <Container>
        <div className="mx-auto max-w-lg">
          <h1 className="text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">Log in to your workspace</h1>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            Every agency has its own Operra workspace at its own address. Enter yours and we’ll take you to its sign-in
            page.
          </p>
          <div className="mt-10 rounded-[var(--radius-frame)] border border-line bg-surface p-6 sm:p-8">
            <WorkspaceLogin />
          </div>
          <dl className="mt-10 space-y-6 text-[0.95rem]">
            <div>
              <dt className="font-medium">Don’t know your address?</dt>
              <dd className="mt-1 text-muted">
                Ask your agency’s admin, or look for your welcome email. Clients get the same address as their agency’s team.
              </dd>
            </div>
            <div>
              <dt className="font-medium">Forgot your password?</dt>
              <dd className="mt-1 text-muted">Your workspace admin can set a new one in Team &amp; Users.</dd>
            </div>
            <div>
              <dt className="font-medium">No workspace yet?</dt>
              <dd className="mt-1 text-muted">
                <Link href="/start" className="text-ink underline underline-offset-4">
                  Start a free trial
                </Link>{" "}
                or{" "}
                <a href={site.demoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-ink underline underline-offset-4">
                  open the live demo
                  <ExternalLink aria-hidden className="size-3.5" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
                .
              </dd>
            </div>
          </dl>
        </div>
      </Container>
    </div>
  );
}
