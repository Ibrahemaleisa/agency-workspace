import Link from "next/link";
import { Palette } from "lucide-react";
import type { Role } from "@/db/schema";
import { DEMO_ROLES } from "@/lib/demo-sandbox";
import type { DemoDict } from "@/lib/i18n-demo";
import { switchDemoRole } from "@/server/demo-actions";
import { logoutAction } from "@/server/auth-actions";
import { cn } from "./ui";

/**
 * Shown inside a visitor's private demo copy: it's theirs alone and goes away when they sign out;
 * they can look at the same agency as each role, restyle it, or end the demo.
 */
export function DemoBar({ role, canBrand, t }: { role: Role; canBrand: boolean; t: DemoDict["bar"] }) {
  return (
    <div data-testid="demo-bar" className="border-b border-sand-300/60 bg-sand-100 text-ink">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 text-sm md:px-8">
        <p className="flex min-w-0 flex-1 basis-72 items-center gap-2">
          <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-semibold text-sand-200">{t.label}</span>
          <span className="text-[13px] text-zinc-700">{t.text}</span>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] text-zinc-600">{t.viewAs}</span>
          <div role="group" aria-label={t.viewAs} className="flex rounded-full bg-white p-0.5 ring-1 ring-zinc-200">
            {DEMO_ROLES.map((r) =>
              r === role ? (
                <span key={r} aria-current="true" className="rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white">
                  {t.roles[r]}
                </span>
              ) : (
                <form key={r} action={switchDemoRole}>
                  <input type="hidden" name="role" value={r} />
                  <button data-testid={`demo-view-${r}`} className="rounded-full px-3 py-1 text-xs font-medium text-zinc-600 hover:text-ink">
                    {t.roles[r]}
                  </button>
                </form>
              ),
            )}
          </div>
          {canBrand && (
            <Link
              href="/settings/brand"
              className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium ring-1 ring-zinc-200 hover:ring-ink"
            >
              <Palette aria-hidden className="size-3.5" /> {t.brand}
            </Link>
          )}
          <form action={logoutAction}>
            <button
              data-testid="demo-end"
              className={cn("rounded-full px-3 py-1 text-xs font-medium text-red-700 ring-1 ring-red-200 hover:bg-red-50")}
            >
              {t.end}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
