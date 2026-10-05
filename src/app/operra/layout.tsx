import "@fontsource-variable/alexandria";
import type { Metadata } from "next";
import { OPERRA_BRAND, brandCss } from "@/lib/brand";

export const metadata: Metadata = { title: "Control center · Operra", robots: { index: false, follow: false } };

/** Operra staff only. Isolated from tenant administration (own auth, own cookie path). */
export default function ControlLayout({ children }: LayoutProps<"/operra">) {
  return (
    <div className="operra-platform min-h-screen bg-[#F7F7F4] text-[#15171C]" lang="en" dir="ltr">
      <style>{`${brandCss(OPERRA_BRAND)} .operra-platform{font-family:"Alexandria Variable",system-ui,sans-serif} .operra-platform .font-mono{font-family:inherit;font-variant-numeric:tabular-nums}`}</style>
      {children}
    </div>
  );
}
