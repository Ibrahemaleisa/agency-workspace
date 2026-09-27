import { getImageProps } from "next/image";
import { shots } from "@/content/shots";
import { getLocale } from "@/i18n/server";
import { BrowserBar } from "./product-frame";

/**
 * Hero: the real product at 1:1. Art-directed — the desktop dashboard from 640px up, and the
 * product's real phone layout below that (a desktop capture is unreadable at phone width).
 */
export async function HeroShot() {
  const ar = (await getLocale()) === "ar";
  const desktopSizes = "(min-width: 1200px) 1140px, 100vw";
  const {
    props: { srcSet: desktop },
  } = getImageProps({ src: ar ? shots.dashboard.srcAr : shots.dashboard.src, alt: "", sizes: desktopSizes, fetchPriority: "high" });
  const {
    props: { srcSet: mobile, ...img },
  } = getImageProps({
    src: ar ? shots.mobileDashboard.srcAr : shots.mobileDashboard.src,
    alt: ar ? shots.dashboard.altAr : shots.dashboard.alt,
    sizes: "100vw",
    fetchPriority: "high",
    loading: "eager",
  });

  return (
    <figure className="overflow-hidden rounded-t-xl border border-b-0 border-line bg-surface">
      <BrowserBar className="hidden sm:flex" />
      <picture>
        <source media="(min-width: 640px)" srcSet={desktop} sizes={desktopSizes} />
        <source srcSet={mobile} sizes="100vw" />
        <img {...img} alt={img.alt} className="block h-auto w-full max-sm:max-h-[520px] max-sm:object-cover max-sm:object-top" />
      </picture>
    </figure>
  );
}
