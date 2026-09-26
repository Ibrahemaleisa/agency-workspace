import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { LiveO } from "@/components/logo";
import { Container } from "@/components/section";
import { WorkspaceLogin } from "@/components/workspace-login";
import { pageMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Log in",
  description: "Sign in to your agency’s Operra workspace.",
  path: "/login",
});

const label = "font-mono text-[11px] leading-4 font-medium tracking-[0.08em] uppercase";
const link = "text-ink underline underline-offset-4";

export default function LoginPage() {
  return (
    <div className="bg-paper py-16 sm:py-24">
      <Container>
        <div className="mx-auto max-w-lg">
          <LiveO className="size-10" />
          <h1 className="mt-6 text-[32px] leading-[38px] font-semibold tracking-[-0.02em] sm:text-[40px] sm:leading-[46px]">
            Log in to your workspace
          </h1>
          <p className="mt-3 text-[17px] leading-[26px] text-muted">
            Every agency has its own Operra workspace at its own address. Enter yours and we’ll take you to its sign-in page.
          </p>
          <div className="mt-8 rounded-lg border border-line bg-surface p-5 sm:p-6">
            <WorkspaceLogin />
          </div>
          <dl className="mt-10 divide-y divide-line border-y border-line text-[15px] leading-[22px]">
            <div className="py-4">
              <dt className={`text-muted ${label}`}>Don’t know your address</dt>
              <dd className="mt-1.5 text-muted">
                Ask your agency’s admin, or look for your welcome email. Clients use the same address as their agency’s team.
              </dd>
            </div>
            <div className="py-4">
              <dt className={`text-muted ${label}`}>Forgot your password</dt>
              <dd className="mt-1.5 text-muted">Your workspace admin can set a new one in Team &amp; Users.</dd>
            </div>
            <div className="py-4">
              <dt className={`text-muted ${label}`}>No workspace yet</dt>
              <dd className="mt-1.5 text-muted">
                <Link href="/start" className={link}>
                  Start a free trial
                </Link>{" "}
                or{" "}
                <a href={site.demoUrl} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1 ${link}`}>
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
