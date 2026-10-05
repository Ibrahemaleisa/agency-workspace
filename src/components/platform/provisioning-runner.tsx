"use client";

import { useEffect, useRef, useState } from "react";
import type { ProvisionState } from "@/server/signup-actions";
import { buttonClass } from "../ui";
import { Dot } from "./operra-mark";

type Labels = {
  steps: string[];
  done: string;
  instance: string;
  address: string;
  enter: string;
  /** Already filled in with the sign-in address. */
  signInLater: string;
  failed: string;
  retry: string;
  restart: string;
};

/**
 * Calls the (idempotent) provisioning action once on mount and shows its steps.
 * The step ticker is presentation only: the work happens in one server transaction,
 * and the result — including the database-generated instance ID — comes from the server.
 */
export function ProvisioningRunner({
  run,
  enter,
  labels,
}: {
  run: () => Promise<ProvisionState>;
  enter: () => Promise<void>;
  labels: Labels;
}) {
  const [result, setResult] = useState<ProvisionState | null>(null);
  const [tick, setTick] = useState(0);
  const started = useRef(false);

  const start = () => {
    setResult(null);
    setTick(0);
    run()
      .then(setResult)
      .catch(() => setResult({ status: "failed", error: labels.failed }));
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (result) return;
    const id = setInterval(() => setTick((n) => Math.min(n + 1, labels.steps.length - 1)), 450);
    return () => clearInterval(id);
  }, [result, labels.steps.length]);

  const done = result?.status === "completed";
  const current = done ? labels.steps.length : tick;

  return (
    <div>
      <ol className="space-y-3" aria-live="polite">
        {labels.steps.map((s, i) => (
          <li key={s} className="flex items-center gap-3 text-[15px]">
            <Dot state={i < current ? "done" : i === current && !result ? "live" : "next"} />
            <span className={i <= current ? "text-zinc-900" : "text-zinc-500"}>{s}</span>
          </li>
        ))}
      </ol>

      {done && result.status === "completed" && (
        <div className="mt-8 border-t border-[#E1E2DE] pt-6" role="status">
          <p className="text-lg font-semibold">{labels.done}</p>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-[#5B606B]">{labels.instance}</dt>
              <dd className="mt-1 font-mono text-xl font-medium" data-testid="instance-serial">
                {result.serial}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-[#5B606B]">{labels.address}</dt>
              <dd className="mt-1 font-mono text-sm break-all" dir="ltr">
                {result.entry}
              </dd>
            </div>
          </dl>
          <form action={enter} className="mt-6">
            <button type="submit" className={buttonClass("primary")}>
              {labels.enter}
            </button>
          </form>
          <p className="mt-4 text-sm text-[#5B606B]" dir="auto">{labels.signInLater}</p>
        </div>
      )}

      {result?.status === "failed" && (
        <div className="mt-8 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
          <p>{result.error}</p>
          {result.restart ? (
            <a href="/signup/company" className={`${buttonClass("secondary", "sm")} mt-3`}>
              {labels.restart}
            </a>
          ) : (
            <button type="button" onClick={start} className={`${buttonClass("secondary", "sm")} mt-3`}>
              {labels.retry}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
