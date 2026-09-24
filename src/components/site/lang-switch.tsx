import type { Lang } from "@/lib/i18n";
import { cn } from "../ui";

/** AR | EN segmented toggle. Plain links (full reload) so text direction flips everywhere. */
export function LangSwitch({
  lang,
  next,
  className,
  tone = "dark",
}: {
  lang: Lang;
  next: string;
  className?: string;
  tone?: "dark" | "light";
}) {
  const options: { value: Lang; label: string; title: string }[] = [
    { value: "ar", label: "AR", title: "العربية" },
    { value: "en", label: "EN", title: "English" },
  ];
  return (
    <div
      dir="ltr"
      role="group"
      aria-label="Language"
      className={cn(
        "flex items-center rounded-full border p-0.5 text-xs font-semibold",
        tone === "dark" ? "border-white/15 bg-white/5" : "border-zinc-200 bg-white",
        className,
      )}
    >
      {options.map((o) =>
        o.value === lang ? (
          <span
            key={o.value}
            aria-current="true"
            title={o.title}
            className={cn("rounded-full px-3 py-1.5", tone === "dark" ? "bg-sand-200 text-ink" : "bg-ink text-white")}
          >
            {o.label}
          </span>
        ) : (
          <a
            key={o.value}
            href={`/lang?to=${o.value}&next=${encodeURIComponent(next)}`}
            hrefLang={o.value}
            title={o.title}
            className={cn(
              "rounded-full px-3 py-1.5 transition",
              tone === "dark" ? "text-zinc-400 hover:text-white" : "text-zinc-500 hover:text-ink",
            )}
          >
            {o.label}
          </a>
        ),
      )}
    </div>
  );
}
