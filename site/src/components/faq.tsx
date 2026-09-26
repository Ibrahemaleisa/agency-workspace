import { Plus } from "lucide-react";
import type { Faq } from "@/content/pricing";

export function FaqList({ items }: { items: Faq[] }) {
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((f) => (
        <details key={f.q} className="group py-5 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-[1.05rem] font-medium">
            {f.q}
            <Plus
              aria-hidden
              className="mt-1 size-4 shrink-0 text-subtle transition-transform duration-200 group-open:rotate-45"
            />
          </summary>
          <p className="mt-3 max-w-3xl leading-relaxed text-muted">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
