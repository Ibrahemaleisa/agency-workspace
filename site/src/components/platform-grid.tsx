import { getContent } from "@/i18n/server";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";

/** Hairline grid of platform foundations — hairlines instead of boxes. */
export async function PlatformGrid({ onPanel }: { onPanel?: boolean }) {
  const { PLATFORM } = await getContent();
  return (
    <ul
      className={cn(
        "grid gap-px overflow-hidden rounded-lg border sm:grid-cols-2 lg:grid-cols-4",
        onPanel ? "border-line-panel bg-line-panel" : "border-line bg-line",
      )}
    >
      {PLATFORM.map((f) => (
        <li key={f.title} className={cn("p-6", onPanel ? "bg-panel" : "bg-surface")}>
          <Icon name={f.icon} className={cn("size-5", onPanel ? "text-on-panel" : "text-ink")} />
          <h3 className="mt-4 text-[15px] leading-[22px] font-medium">{f.title}</h3>
          <p className={cn("mt-1.5 text-[14px] leading-5", onPanel ? "text-on-panel-muted" : "text-muted")}>{f.body}</p>
        </li>
      ))}
    </ul>
  );
}
