import { TrialForm } from "@/components/inquiry-forms";
import { Container } from "@/components/section";
import { StatusDot, type DotState } from "@/components/status-dot";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Start free trial",
  description: "Request your own Operra workspace: a dedicated, branded workspace and database for your agency, with every feature included.",
  path: "/start",
});

const label = "font-mono text-[11px] leading-4 font-medium tracking-[0.08em] uppercase";

const NEXT: { title: string; body: string; state: DotState }[] = [
  { title: "You tell us about your agency", body: "Two minutes, on this page.", state: "live" },
  { title: "We set up your workspace", body: "A dedicated deployment and database, ready for your team.", state: "draft" },
  { title: "You get the admin sign-in", body: "By email, with your workspace address.", state: "draft" },
  { title: "Brand it, invite your team", body: "Name, logo and colours in Settings → Brand, then your team and clients.", state: "draft" },
];

const INCLUDED = ["Every feature, no tiers", "Arabic and English", "Client portal and approvals", "Your own data, kept separate"];

export default function StartPage() {
  return (
    <div className="bg-paper py-14 sm:py-20">
      <Container className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <div>
          <p className={`text-muted ${label}`}>Start free trial</p>
          <h1 className="mt-4 text-[40px] leading-[44px] font-semibold tracking-[-0.03em] sm:text-[48px] sm:leading-[52px]">
            Get your agency’s own workspace
          </h1>
          <p className="mt-4 text-[17px] leading-[26px] text-muted">
            Operra isn’t a shared app you sign up to. Each agency gets a dedicated workspace. Tell us about yours and we’ll set it
            up.
          </p>
          <h2 className={`mt-12 text-muted ${label}`}>What happens next</h2>
          <ol className="mt-5">
            {NEXT.map((n, i) => (
              <li key={n.title} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <StatusDot state={n.state} className="mt-1.5" />
                  {i < NEXT.length - 1 && <span aria-hidden className="mt-1.5 w-px flex-1 bg-line-strong" />}
                </div>
                <div className="pb-6">
                  <p className="text-[15px] leading-[22px] font-medium">{n.title}</p>
                  <p className="mt-0.5 text-[14px] leading-5 text-muted">{n.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <ul className="mt-4 grid grid-cols-2 gap-x-6 border-t border-line pt-6">
            {INCLUDED.map((i) => (
              <li key={i} className="border-b border-line py-2.5 text-[14px] leading-5">
                {i}
              </li>
            ))}
          </ul>
        </div>
        <div className="self-start rounded-lg border border-line bg-surface p-5 sm:p-8">
          <TrialForm />
        </div>
      </Container>
    </div>
  );
}
