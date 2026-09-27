import Link from "next/link";
import type { ReactNode } from "react";
import { formatDistanceToNowStrict } from "date-fns";

/* Small building blocks shared by the control center's analytics pages. */

export const label = "font-mono text-[11px] tracking-[0.08em] text-[#5A606B] uppercase";

export function Stats({ items }: { items: (readonly [string, ReactNode])[] }) {
  return (
    <dl
      className={`grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[#E3E4E0] bg-[#E3E4E0] ${items.length === 4 ? "sm:grid-cols-4" : "sm:grid-cols-3 lg:grid-cols-6"}`}
    >
      {items.map(([k, v]) => (
        <div key={k} className="bg-white p-4">
          <dt className={label}>{k}</dt>
          <dd className="mt-1 font-mono text-2xl">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Table({ head, children, empty, minWidth = 720 }: { head: string[]; children: ReactNode; empty?: string | false; minWidth?: number }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[#E3E4E0] bg-white">
      <table className="w-full text-sm" style={{ minWidth }}>
        <thead className={`border-b border-[#E3E4E0] ${label}`}>
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className="px-4 py-2.5 text-start font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E3E4E0]">
          {children}
          {empty && (
            <tr>
              <td colSpan={head.length} className="px-4 py-8 text-center text-[#5A606B]">
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Td({ children, mono, muted }: { children: ReactNode; mono?: boolean; muted?: boolean }) {
  return <td className={`px-4 py-3 align-top ${mono ? "font-mono" : ""} ${muted ? "text-[#5A606B]" : ""}`}>{children}</td>;
}

/** "3 min ago" with the exact time on hover; "—" when never. */
export function Ago({ at }: { at: Date | string | null | undefined }) {
  if (!at) return <span className="text-[#5A606B]">—</span>;
  const d = typeof at === "string" ? new Date(at) : at;
  return (
    <time dateTime={d.toISOString()} title={d.toUTCString()}>
      {formatDistanceToNowStrict(d, { addSuffix: true })}
    </time>
  );
}

export const PERIODS = [7, 30, 90] as const;

export function periodOf(v: unknown) {
  const n = Number(v);
  return (PERIODS as readonly number[]).includes(n) ? n : 30;
}

export function PeriodPicker({ days, base }: { days: number; base: string }) {
  return (
    <nav aria-label="Period" className="flex gap-1 rounded-md border border-[#E3E4E0] bg-white p-1 text-sm">
      {PERIODS.map((p) => (
        <Link
          key={p}
          href={`${base}?d=${p}`}
          aria-current={p === days ? "page" : undefined}
          className={`rounded px-2.5 py-1 ${p === days ? "bg-[#0B0D10] text-white" : "hover:bg-[#F6F6F3]"}`}
        >
          {p} days
        </Link>
      ))}
    </nav>
  );
}

/** Sign-up steps as the funnel names them (signups.step = last completed step). */
export const SIGNUP_STEPS = ["Account", "Company", "Brand", "Plan", "Workspace created"] as const;

/** Where an unfinished sign-up stopped, from its last completed step. */
export function stoppedAt(step: number) {
  return ["Account details", "Company details", "Brand", "Plan choice", "Workspace setup"][Math.min(step, 4)];
}

export const EVENT_LABEL: Record<string, string> = {
  site_view: "Visited the website",
  signup_view: "Opened sign-up step",
  signup_step: "Completed sign-up step",
  workspace_created: "Workspace created",
  login: "Signed in",
  login_failed: "Failed sign-in",
  active: "Used the workspace",
};
