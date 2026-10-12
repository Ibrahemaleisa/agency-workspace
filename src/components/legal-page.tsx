import Link from "next/link";
import type { LegalDoc } from "@/content/legal";

/** A legal document (terms, privacy) on the public pages. */
export function LegalPage({ doc, other, back }: { doc: LegalDoc; other: { href: string; label: string }; back: { href: string; label: string } }) {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12 md:py-16">
      <nav className="mb-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-400">
        <Link href={back.href} className="hover:text-white">
          {back.label}
        </Link>
        <Link href={other.href} className="hover:text-white">
          {other.label}
        </Link>
      </nav>
      <article className="rounded-2xl bg-white p-6 text-zinc-800 md:p-10">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 md:text-3xl">{doc.title}</h1>
        <p className="mt-1 text-sm text-zinc-500">{doc.updated}</p>
        <p className="mt-6 leading-7">{doc.intro}</p>
        {doc.sections.map((s) => (
          <section key={s.title} className="mt-8">
            <h2 className="text-lg font-semibold text-zinc-900">{s.title}</h2>
            {s.body.map((p, i) => (
              <p key={i} className="mt-3 leading-7">
                {p}
              </p>
            ))}
          </section>
        ))}
      </article>
    </main>
  );
}
