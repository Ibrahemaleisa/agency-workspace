import Link from "next/link";
import type { Metadata } from "next";
import { BadgeCheck, CheckSquare, LayoutDashboard } from "lucide-react";
import { getSaasT } from "@/lib/i18n-saas";
import { startPreview } from "@/server/preview-actions";
import { buttonClass } from "@/components/ui";

export const metadata: Metadata = {
  title: "Explore Operra · Preview",
  description: "Step inside a working sample agency in Operra — no account needed.",
};

const ICONS = { admin: LayoutDashboard, employee: CheckSquare, client: BadgeCheck } as const;

export default async function PreviewPage({ searchParams }: PageProps<"/preview">) {
  const sp = await searchParams;
  const { t } = await getSaasT();
  const p = t.preview;
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="flex items-center gap-2 font-mono text-[11px] tracking-[0.08em] text-[#5A606B] uppercase">
        <span aria-hidden className="size-2 rounded-full bg-[#FF5A1F]" />
        {p.note}
      </p>
      <h1 className="mt-4 text-[32px] leading-[38px] font-semibold tracking-[-0.02em] sm:text-[40px] sm:leading-[46px]">{p.title}</h1>
      <p className="mt-3 max-w-2xl text-[16px] leading-[24px] text-[#5A606B]">{p.sub}</p>
      {(sp.unavailable || sp.limited) && (
        <p role="alert" className="mt-6 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {sp.limited ? p.rate : p.unavailable}
        </p>
      )}
      <ul className="mt-10 grid gap-px overflow-hidden rounded-xl border border-[#E3E4E0] bg-[#E3E4E0] md:grid-cols-3">
        {(["admin", "employee", "client"] as const).map((role) => {
          const r = p.roles[role];
          const Icon = ICONS[role];
          return (
            <li key={role} className="flex flex-col bg-white p-6">
              <Icon aria-hidden className="size-5" />
              <h2 className="mt-4 text-lg font-semibold">{r.title}</h2>
              <p className="mt-1 font-mono text-[12px] text-[#5A606B]">{r.who}</p>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-[#5A606B]">{r.body}</p>
              <form action={startPreview} className="mt-6">
                <input type="hidden" name="role" value={role} />
                <button className={`${buttonClass("primary")} w-full`} data-testid={`preview-${role}`}>
                  {p.enter} {r.title.toLowerCase()}
                </button>
              </form>
            </li>
          );
        })}
      </ul>
      <p className="mt-10 text-sm text-[#5A606B]">
        {p.signup}{" "}
        <Link href="/signup" className="font-medium text-[#0B0D10] underline underline-offset-4">
          {p.signupCta}
        </Link>
      </p>
    </div>
  );
}
