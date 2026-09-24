import Link from "next/link";
import { cn } from "./ui";

/** Row of link-based filter pills (keeps filters in the URL, no client JS). */
export function FilterTabs({
  options,
  current,
  hrefFor,
}: {
  options: { value: string; label: string; count?: number }[];
  current: string;
  hrefFor: (value: string) => string;
}) {
  return (
    <div className="no-scrollbar -mx-4 flex max-w-[100vw] gap-1.5 overflow-x-auto px-4 md:mx-0 md:max-w-none md:flex-wrap md:px-0">
      {options.map((o) => (
        <Link
          key={o.value}
          href={hrefFor(o.value)}
          className={cn(
            "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition",
            current === o.value
              ? "bg-zinc-900 text-white shadow-sm"
              : "bg-white text-zinc-600 ring-1 ring-zinc-200 ring-inset hover:text-zinc-900 hover:ring-zinc-300",
          )}
        >
          {o.label}
          {o.count !== undefined && (
            <span className={cn("ms-1.5 text-xs tabular-nums", "text-zinc-400")}>{o.count}</span>
          )}
        </Link>
      ))}
    </div>
  );
}

export function SearchBox({ defaultValue, placeholder, hidden }: { defaultValue?: string; placeholder: string; hidden?: Record<string, string | undefined> }) {
  return (
    <form className="w-full sm:w-64">
      {hidden &&
        Object.entries(hidden).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
      <input
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="block w-full rounded-full border-0 bg-white px-4 py-2 text-sm shadow-xs ring-1 ring-zinc-300 ring-inset placeholder:text-zinc-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
      />
    </form>
  );
}
