import { Check } from "lucide-react";
import type { FeatureTheme } from "@/content/en/features";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";
import { ProductFrame } from "./product-frame";

const CROPPED = (shot: string) => shot.startsWith("crop");

/** One product theme: copy on one side, the real screen on the other. */
export function FeatureRow({
  theme,
  index,
  flip,
  headingLevel = 3,
}: {
  theme: FeatureTheme;
  index?: number;
  flip?: boolean;
  headingLevel?: 2 | 3;
}) {
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <article id={theme.id} className="grid scroll-mt-20 items-center gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
      <div className={cn(flip && "lg:order-2")}>
        <p className="flex items-center gap-2 text-[13px] leading-5 font-medium text-muted">
          <Icon name={theme.icon} className="size-4 text-ink" />
          {index !== undefined && `${String(index).padStart(2, "0")} — `}
          {theme.eyebrow}
        </p>
        <H className="mt-4 text-[28px] leading-[34px] font-semibold tracking-[-0.02em] sm:text-[32px] sm:leading-[38px]">{theme.title}</H>
        <p className="mt-4 text-[16px] leading-[24px] text-muted">{theme.body}</p>
        <ul className="mt-6 divide-y divide-line border-y border-line">
          {theme.bullets.map((b) => (
            <li key={b} className="flex gap-3 py-2.5 text-[14px] leading-5">
              <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-ink" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className={cn("min-w-0", flip && "lg:order-1")}>
        <ProductFrame
          shot={theme.shot}
          variant={CROPPED(theme.shot) ? "card" : "browser"}
          sizes="(min-width: 1200px) 680px, (min-width: 1024px) 58vw, 100vw"
        />
      </div>
    </article>
  );
}
