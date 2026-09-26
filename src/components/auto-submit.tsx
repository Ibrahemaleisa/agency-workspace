"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** A form that submits itself once on mount (e.g. continue straight to checkout after sign-up). */
export function AutoSubmitForm({ action, children }: { action: () => Promise<void>; children: ReactNode }) {
  const ref = useRef<HTMLFormElement>(null);
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    ref.current?.requestSubmit();
  }, []);
  return (
    <form ref={ref} action={action}>
      {children}
    </form>
  );
}
