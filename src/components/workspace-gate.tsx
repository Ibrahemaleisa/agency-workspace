import { logoutAction } from "@/server/auth-actions";

/** Full-screen notice when a workspace is paused or its trial has ended. */
export function WorkspaceGate({
  title,
  body,
  billingHref,
  billingLabel,
  signOutLabel,
}: {
  title: string;
  body: string;
  billingHref?: string;
  billingLabel?: string;
  signOutLabel: string;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-12">
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h1 className="text-lg font-semibold text-zinc-900">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">{body}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {billingHref && (
            // A full page load: the shared layout decides again (billing stays reachable while locked).
            <a href={billingHref} className="rounded-lg bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white">
              {billingLabel}
            </a>
          )}
          <form action={logoutAction}>
            <button className="rounded-lg px-3.5 py-2 text-sm font-medium ring-1 ring-zinc-300">{signOutLabel}</button>
          </form>
        </div>
      </div>
    </main>
  );
}
