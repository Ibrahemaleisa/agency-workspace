import Link from "next/link";

type Labels = { terms: string; privacy: string; agreeBefore: string; and: string; joinNote: string };

/** "By continuing you agree to the Terms of Service and the Privacy Policy." */
export function LegalNote({ labels, className }: { labels: Labels; className?: string }) {
  return (
    <p className={className ?? "text-xs text-zinc-500"}>
      {labels.joinNote}{" "}
      <Link href="/terms" target="_blank" className="underline underline-offset-2">
        {labels.terms}
      </Link>{" "}
      {labels.and}{" "}
      <Link href="/privacy" target="_blank" className="underline underline-offset-2">
        {labels.privacy}
      </Link>
      .
    </p>
  );
}

/** Required consent checkbox (sign-up). */
export function LegalConsent({ labels }: { labels: Labels }) {
  return (
    <label className="flex items-start gap-2 text-sm text-zinc-700">
      <input type="checkbox" name="acceptTerms" value="1" required className="mt-0.5 size-4 accent-indigo-600" />
      <span>
        {labels.agreeBefore}{" "}
        <Link href="/terms" target="_blank" className="underline underline-offset-2">
          {labels.terms}
        </Link>{" "}
        {labels.and}{" "}
        <Link href="/privacy" target="_blank" className="underline underline-offset-2">
          {labels.privacy}
        </Link>
      </span>
    </label>
  );
}
