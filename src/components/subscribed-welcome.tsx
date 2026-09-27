"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PartyPopper } from "lucide-react";
import { buttonClass } from "./ui";

/**
 * Shown on the dashboard when the admin comes back from paying (/?subscribed=1):
 * - "pending": the provider hasn't confirmed yet — refreshes every few seconds until it does;
 * - "welcome": a customer who was already on a trial gets a congratulations message
 *   (a brand-new customer gets the tutorial instead, so nothing is shown for them).
 */
export function SubscribedWelcome({
  state,
  labels,
  onDone,
}: {
  state: "pending" | "welcome";
  labels: { pending: string; title: string; body: string; cta: string };
  /** Remember that the welcome was seen (plans activated by Operra staff). */
  onDone?: () => Promise<void>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (state !== "pending") return;
    let tries = 0;
    const id = setInterval(() => {
      tries += 1;
      if (tries > 40) clearInterval(id);
      router.refresh();
    }, 3000);
    return () => clearInterval(id);
  }, [state, router]);

  if (state === "pending") {
    return (
      <div role="status" className="mb-6 flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700">
        <span aria-hidden className="size-2 animate-pulse rounded-full bg-zinc-900" />
        {labels.pending}
      </div>
    );
  }
  if (!open) return null;
  const close = () => {
    setOpen(false);
    void onDone?.();
    router.replace("/");
  };
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="subscribed-title">
      <div aria-hidden className="absolute inset-0 bg-black/50" onClick={close} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-7 text-center shadow-xl">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <PartyPopper aria-hidden className="size-7" />
        </span>
        <h2 id="subscribed-title" className="mt-4 text-xl font-semibold">
          {labels.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">{labels.body}</p>
        <button type="button" autoFocus onClick={close} className={`${buttonClass("primary")} mt-6 w-full`}>
          {labels.cta}
        </button>
      </div>
    </div>
  );
}
