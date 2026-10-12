import type { ReactNode } from "react";
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
      {/* Stage bars (BRAND.md): done and current in lapis, still to come in line grey. */}
      <ol className="grid max-w-xl gap-2" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }} aria-label="Sign-up progress">
        {steps.map((s, i) => (
          <li key={s} className="min-w-0 text-[13px]" aria-current={i === current ? "step" : undefined}>
            <span aria-hidden className={`block h-1.5 rounded-full ${i <= current ? "bg-[#1F3FBF]" : "bg-[#E1E2DE]"}`} />
            <span className={`mt-2 block truncate ${i === current ? "font-semibold" : "text-[#5B606B]"}`}>{s}</span>
          </li>
        ))}
      </ol>
      {bare ? (
        <div className="mt-8">
          <h1 className="text-[28px] leading-[34px] font-semibold tracking-[-0.02em] sm:text-[32px] sm:leading-[38px]">{title}</h1>
          {sub && <p className="mt-2 max-w-xl text-[15px] leading-[22px] text-[#5B606B]">{sub}</p>}
          <div className="mt-8">{children}</div>
        </div>
      ) : (
      <div className={aside ? "mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12" : "mt-8 max-w-xl"}>
        <div>
          <h1 className="text-[28px] leading-[34px] font-semibold tracking-[-0.02em] sm:text-[32px] sm:leading-[38px]">{title}</h1>
          {sub && <p className="mt-2 text-[15px] leading-[22px] text-[#5B606B]">{sub}</p>}
          <div className="mt-8 rounded-xl border border-[#E1E2DE] bg-white p-5 sm:p-6">{children}</div>
        </div>
        {aside && <div className="min-w-0">{aside}</div>}
      </div>
      )}
    </div>
  );
}
