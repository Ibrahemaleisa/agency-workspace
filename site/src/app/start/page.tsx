import { Check } from "lucide-react";
import { TrialForm } from "@/components/inquiry-forms";
import { Container } from "@/components/section";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Start free trial",
  description: "Request your own Operra workspace: a dedicated, branded workspace and database for your agency, with every feature included.",
  path: "/start",
});

const NEXT = [
  { title: "We set up your workspace", body: "A dedicated deployment and database, ready for your team." },
  { title: "You get the admin sign-in", body: "By email, with your workspace address." },
  { title: "Brand it and invite your team", body: "Name, logo and colours in Settings → Brand, then your team and clients." },
];

const INCLUDED = ["Every feature, no tiers", "Arabic and English", "Client portal and approvals", "Your own data, kept separate"];

export default function StartPage() {
  return (
    <div className="bg-paper py-16 sm:py-24">
      <Container className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <div>
          <p className="text-[0.8rem] font-medium tracking-[0.08em] text-sand-deep uppercase">Start free trial</p>
          <h1 className="mt-3 text-4xl leading-[1.05] font-semibold tracking-[-0.035em] sm:text-5xl">
            Get your agency’s own workspace.
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-muted">
            Operra isn’t a shared app you sign up to — each agency gets a dedicated workspace. Tell us about yours and we’ll
            set it up.
          </p>
          <h2 className="mt-12 text-sm font-medium">What happens next</h2>
          <ol className="mt-5 space-y-5">
            {NEXT.map((n, i) => (
              <li key={n.title} className="flex gap-4">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ink text-xs font-medium text-sand tabular-nums">
                  {i + 1}
                </span>
                <div>
                  <p className="font-medium">{n.title}</p>
                  <p className="mt-0.5 text-sm text-muted">{n.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <ul className="mt-10 grid grid-cols-2 gap-3 border-t border-line pt-8 text-sm">
            {INCLUDED.map((i) => (
              <li key={i} className="flex gap-2">
                <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-sand-deep" strokeWidth={2.25} />
                {i}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-[calc(var(--radius-frame)+6px)] border border-line bg-surface p-6 sm:p-10">
          <TrialForm />
        </div>
      </Container>
    </div>
  );
}
