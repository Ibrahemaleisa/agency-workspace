import { PLATFORM } from "@/content/features";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";

export function PlatformGrid({ tone = "light" }: { tone?: "light" | "dark" }) {
  const dark = tone === "dark";
  return (
    <ul
      className={cn(
        "grid overflow-hidden rounded-[var(--radius-frame)] border sm:grid-cols-2 lg:grid-cols-4",
        dark ? "border-white/10 bg-white/10" : "border-line bg-line",
      )}
      style={{ gap: 1 }}
    >
      {PLATFORM.map((f) => (
        <li key={f.title} className={cn("p-6", dark ? "bg-ink" : "bg-surface")}>
          <Icon name={f.icon} className={cn("size-5", dark ? "text-sand" : "text-sand-deep")} />
          <h3 className="mt-4 font-medium">{f.title}</h3>
          <p className={cn("mt-2 text-sm leading-relaxed", dark ? "text-white/55" : "text-muted")}>{f.body}</p>
        </li>
      ))}
    </ul>
  );
}
