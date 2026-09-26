import { Plus } from "lucide-react";
import type { Faq } from "@/content/pricing";

export function FaqList({ items }: { items: Faq[] }) {
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((f) => (
        <details key={f.q} className="group py-4 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-[15px] leading-[22px] font-medium">
            {f.q}
            <Plus aria-hidden className="mt-0.5 size-4 shrink-0 text-muted transition-transform duration-[180ms] group-open:rotate-45" />
          </summary>
          <p className="mt-2 max-w-3xl text-[15px] leading-[22px] text-muted">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
