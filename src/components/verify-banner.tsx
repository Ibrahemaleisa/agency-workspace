"use client";

import { useActionState } from "react";
import { resendVerification } from "@/server/verification-actions";

/** Unconfirmed email: says where the link went and offers a new one (reports what really happened). */
export function VerifyBanner({ title, body, resend, sent }: { title: string; body: string; resend: string; sent: string }) {
  const [state, action, pending] = useActionState(resendVerification, undefined);
  return (
    <div
      role="region"
      aria-label={title}
      className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-amber-200 bg-amber-50 px-4 py-1.5 text-xs text-amber-900 md:ms-64"
    >
      <span>
        <strong className="font-semibold">{title}.</strong> <span dir="auto">{body}</span>
      </span>
      {state?.ok ? (
        <span role="status">{sent}</span>
      ) : (
        <form action={action}>
          <button disabled={pending} className="font-medium underline underline-offset-4 disabled:opacity-60" data-testid="resend-verification">
            {resend}
          </button>
        </form>
      )}
      {state?.error && <span role="alert">{state.error}</span>}
    </div>
  );
}
