import type { ReactNode } from "react";
import { Dot } from "./operra-mark";
import { track } from "@/lib/analytics";
import { currentSignup } from "@/server/signup-actions";

/** Records that a sign-up step was shown (drop-off per step in the control center). Renders nothing. */
async function StepView({ step }: { step: number }) {
  const s = await currentSignup().catch(() => null);
  await track("signup_view", { signupId: s?.id, meta: { step } });
  return null;
}

/** Wizard frame: step track (drawn as status dots), title, and the step's card. */
export function SignupShell({
  steps,
  current,
  title,
  sub,
  children,
  aside,
  bare,
}: {
  steps: string[];
  current: number;
  title: string;
  sub?: string;
  children: ReactNode;
  aside?: ReactNode;
  /** Render children full-width without the card (steps with their own layout). */
  bare?: boolean;
}) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <StepView step={current} />
      <ol className="flex flex-wrap items-center gap-x-3 gap-y-2" aria-label="Sign-up progress">
        {steps.map((s, i) => (
          <li key={s} className="flex items-center gap-2 text-[13px]" aria-current={i === current ? "step" : undefined}>
            <Dot state={i < current ? "done" : i === current ? "live" : "next"} />
            <span className={i === current ? "font-semibold" : "text-[#5A606B]"}>
              <span className="font-mono text-[11px] tracking-[0.08em]">{String(i + 1).padStart(2, "0")}</span> {s}
            </span>
            {i < steps.length - 1 && <span aria-hidden className="h-px w-6 bg-[#8C919A]" />}
          </li>
        ))}
      </ol>
      {bare ? (
        <div className="mt-8">
          <h1 className="text-[28px] leading-[34px] font-semibold tracking-[-0.02em] sm:text-[32px] sm:leading-[38px]">{title}</h1>
          {sub && <p className="mt-2 max-w-xl text-[15px] leading-[22px] text-[#5A606B]">{sub}</p>}
          <div className="mt-8">{children}</div>
        </div>
      ) : (
      <div className={aside ? "mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12" : "mt-8 max-w-xl"}>
        <div>
          <h1 className="text-[28px] leading-[34px] font-semibold tracking-[-0.02em] sm:text-[32px] sm:leading-[38px]">{title}</h1>
          {sub && <p className="mt-2 text-[15px] leading-[22px] text-[#5A606B]">{sub}</p>}
          <div className="mt-8 rounded-xl border border-[#E3E4E0] bg-white p-5 sm:p-6">{children}</div>
        </div>
        {aside && <div className="min-w-0">{aside}</div>}
      </div>
      )}
    </div>
  );
}
