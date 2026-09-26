import { Check } from "lucide-react";
import type { FeatureTheme } from "@/content/features";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";
import { ProductFrame } from "./product-frame";
import { Reveal } from "./reveal";

const CROPPED = (shot: string) => shot.startsWith("crop");

/** One product theme: copy on one side, the real screen on the other. */
export function FeatureRow({ theme, flip, headingLevel = 3 }: { theme: FeatureTheme; flip?: boolean; headingLevel?: 2 | 3 }) {
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <Reveal>
      <article
        id={theme.id}
        className="grid scroll-mt-24 items-center gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16"
      >
        <div className={cn(flip && "lg:order-2")}>
          <p className="flex items-center gap-2 text-sm font-medium text-sand-deep">
            <Icon name={theme.icon} className="size-4" />
            {theme.eyebrow}
          </p>
          <H className="mt-3 text-[1.75rem] leading-tight font-semibold tracking-[-0.03em] sm:text-3xl">{theme.title}</H>
          <p className="mt-4 text-[1.05rem] leading-relaxed text-muted">{theme.body}</p>
          <ul className="mt-6 space-y-3">
            {theme.bullets.map((b) => (
              <li key={b} className="flex gap-3 text-[0.95rem]">
                <Check aria-hidden className="mt-1 size-4 shrink-0 text-sand-deep" strokeWidth={2.25} />
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
    </Reveal>
  );
}
