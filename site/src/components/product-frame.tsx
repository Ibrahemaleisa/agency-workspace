import Image from "next/image";
import { cn } from "@/lib/cn";
import { shots, type Shot, type ShotKey } from "@/content/shots";

/**
 * A real product screenshot. `browser` shows it inside a quiet window frame with the
 * address bar (the workspace runs on the agency's own domain); `card` shows a cropped
 * piece of UI on its own.
 */
export function ProductFrame({
  shot,
  variant = "browser",
  className,
  sizes = "(min-width: 1200px) 1140px, 100vw",
  eager,
  tone = "light",
}: {
  shot: ShotKey;
  variant?: "browser" | "card";
  className?: string;
  sizes?: string;
  eager?: boolean;
  tone?: "light" | "dark";
}) {
  const s: Shot = shots[shot];
  const img = (
    <Image
      src={s.src}
      alt={s.alt}
      sizes={sizes}
      placeholder="blur"
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : undefined}
      className="block h-auto w-full"
    />
  );

  if (variant === "card") {
    return (
      <figure
        className={cn(
          "overflow-hidden rounded-[var(--radius-frame)] border border-line bg-surface shadow-[0_1px_2px_rgb(0_0_0/0.04),0_12px_32px_-12px_rgb(0_0_0/0.12)]",
          className,
        )}
      >
        {img}
      </figure>
    );
  }

  return (
    <figure
      className={cn(
        "overflow-hidden rounded-[var(--radius-frame)] border",
        tone === "dark"
          ? "border-white/10 bg-ink-2 shadow-[0_0_0_1px_rgb(0_0_0/0.4),0_40px_80px_-20px_rgb(0_0_0/0.6)]"
          : "border-line bg-surface shadow-[0_1px_2px_rgb(0_0_0/0.04),0_24px_48px_-16px_rgb(0_0_0/0.14)]",
        className,
      )}
    >
      <div
        aria-hidden
        className={cn(
          "flex items-center gap-3 border-b px-3.5 py-2.5",
          tone === "dark" ? "border-white/8 bg-ink-2" : "border-line bg-paper",
        )}
      >
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className={cn("size-2.5 rounded-full", tone === "dark" ? "bg-white/15" : "bg-ink/12")} />
          ))}
        </div>
        <div
          className={cn(
            "mx-auto hidden max-w-sm flex-1 truncate rounded-md px-3 py-1 text-center font-mono text-[11px] sm:block",
            tone === "dark" ? "bg-white/6 text-white/60" : "bg-surface text-subtle",
          )}
        >
          app.youragency.com{s.path && s.path !== "/" ? s.path : ""}
        </div>
        <div className="w-10" />
      </div>
      {img}
    </figure>
  );
}
