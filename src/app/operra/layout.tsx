import "@fontsource-variable/instrument-sans";
import type { Metadata } from "next";
import { OPERRA_BRAND, brandCss } from "@/lib/brand";

export const metadata: Metadata = { title: "Control center · Operra", robots: { index: false, follow: false } };

/** Operra staff only. Isolated from tenant administration (own auth, own cookie path). */
export default function ControlLayout({ children }: LayoutProps<"/operra">) {
  return (
    <div className="operra-platform min-h-screen bg-[#F6F6F3] text-[#0B0D10]" lang="en" dir="ltr">
      <style>{`${brandCss(OPERRA_BRAND)} .operra-platform{font-family:"Instrument Sans Variable",system-ui,sans-serif}`}</style>
      {children}
    </div>
  );
}
