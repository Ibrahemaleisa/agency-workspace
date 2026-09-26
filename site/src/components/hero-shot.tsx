import { getImageProps } from "next/image";
import { shots } from "@/content/shots";

/**
 * Hero screenshot with art direction: the desktop dashboard from 640px up, and the product's
 * real phone layout below that (a desktop capture is unreadable at phone width).
 */
export function HeroShot() {
  const desktopSizes = "(min-width: 1200px) 1140px, 100vw";
  const {
    props: { srcSet: desktop },
  } = getImageProps({ src: shots.dashboard.src, alt: "", sizes: desktopSizes, fetchPriority: "high" });
  const {
    props: { srcSet: mobile, ...img },
  } = getImageProps({
    src: shots.mobileDashboard.src,
    alt: "Operra agency dashboard: active projects, overdue tasks, pending approvals and the project health matrix.",
    sizes: "100vw",
    fetchPriority: "high",
    loading: "eager",
  });

  return (
    <figure className="overflow-hidden rounded-t-[22px] border border-b-0 border-white/10 bg-ink-2 shadow-[0_0_0_1px_rgb(0_0_0/0.4),0_40px_80px_-20px_rgb(0_0_0/0.6)] sm:rounded-t-[var(--radius-frame)]">
      <div aria-hidden className="hidden items-center gap-3 border-b border-white/8 px-3.5 py-2.5 sm:flex">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="size-2.5 rounded-full bg-white/15" />
          ))}
        </div>
        <div className="mx-auto max-w-sm flex-1 truncate rounded-md bg-white/6 px-3 py-1 text-center font-mono text-[11px] text-white/60">
          app.youragency.com
        </div>
        <div className="w-10" />
      </div>
      <picture>
        <source media="(min-width: 640px)" srcSet={desktop} sizes={desktopSizes} />
        <source srcSet={mobile} sizes="100vw" />
        <img
          {...img}
          alt={img.alt}
          className="block h-auto w-full max-sm:max-h-[520px] max-sm:object-cover max-sm:object-top"
        />
      </picture>
    </figure>
  );
}
