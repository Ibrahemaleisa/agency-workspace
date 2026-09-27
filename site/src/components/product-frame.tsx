import Image from "next/image";
import { cn } from "@/lib/cn";
import { shots, type Shot, type ShotKey } from "@/content/shots";
import { getLocale } from "@/i18n/server";

/**
 * A real product screenshot, shown 1:1 — no floating devices, no tilted mockups.
 * `browser` adds a quiet address bar (workspaces run on the agency's own domain);
 * `card` shows a cropped piece of UI on its own. Hairlines, not shadows.
 */
/** On /ar the Arabic capture is used: the product in Arabic, right to left. */
export async function ProductFrame({
  shot,
  variant = "browser",
  className,
  sizes = "(min-width: 1200px) 1140px, 100vw",
  eager,
}: {
  shot: ShotKey;
  variant?: "browser" | "card";
  className?: string;
  sizes?: string;
  eager?: boolean;
}) {
  const s: Shot = shots[shot];
  const ar = (await getLocale()) === "ar";
  const img = (
    <Image
      src={ar ? s.srcAr : s.src}
      alt={ar ? s.altAr : s.alt}
      sizes={sizes}
      placeholder="blur"
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : undefined}
      className="block h-auto w-full"
    />
  );

  if (variant === "card") {
    return <figure className={cn("overflow-hidden rounded-lg border border-line bg-surface", className)}>{img}</figure>;
  }

  return (
    <figure className={cn("overflow-hidden rounded-xl border border-line bg-surface", className)}>
      <BrowserBar path={s.path} />
      {img}
    </figure>
  );
}

export function BrowserBar({ path, className }: { path?: string; className?: string }) {
  return (
    <div aria-hidden className={cn("flex items-center gap-3 border-b border-line bg-paper px-3.5 py-2", className)}>
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className="size-2 rounded-full bg-line" />
        ))}
      </div>
      <div dir="ltr" className="mx-auto hidden max-w-sm flex-1 truncate rounded-xs border border-line bg-surface px-3 py-0.5 text-center font-mono text-[11px] text-muted sm:block">
        app.youragency.com{path && path !== "/" ? path : ""}
      </div>
      <div className="w-8" />
    </div>
  );
}
