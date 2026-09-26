import Link from "next/link";
import { logoutAction } from "@/server/auth-actions";

/** Preview sessions: a persistent, clearly worded notice. Also read by the error page. */
export function PreviewBanner({
  text,
  startTrial,
  exit,
  readOnlyTitle,
  readOnlyBody,
}: {
  text: string;
  startTrial: string;
  exit: string;
  readOnlyTitle: string;
  readOnlyBody: string;
}) {
  return (
    <div
      id="preview-mode"
      data-title={readOnlyTitle}
      data-body={readOnlyBody}
      data-cta={startTrial}
      className="sticky top-0 z-40 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 bg-[#121519] px-4 py-2 text-center text-xs text-[#F6F6F3] md:ms-64"
      role="region"
      aria-label="Preview"
    >
      <span className="flex items-center gap-2">
        <span aria-hidden className="size-2 rounded-full bg-[#FF5A1F]" />
        {text}
      </span>
      <span className="flex items-center gap-3">
        <Link href="/signup" className="rounded-md bg-[#F6F6F3] px-2.5 py-1 font-medium text-[#0B0D10]">
          {startTrial}
        </Link>
        <form action={logoutAction}>
          <button className="underline underline-offset-4">{exit}</button>
        </form>
      </span>
    </div>
  );
}

export function TrialBanner({ text, cta }: { text: string; cta: string }) {
  return (
    <div className="flex items-center justify-center gap-3 border-b border-zinc-200/70 bg-white px-4 py-1.5 text-xs text-zinc-600 md:ms-64">
      <span>{text}</span>
      <Link href="/settings/billing" className="font-medium text-zinc-900 underline underline-offset-4">
        {cta}
      </Link>
    </div>
  );
}
