import Link from "next/link";
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isValid, parse, startOfMonth, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getT } from "@/lib/lang";
import { listTasks, todayISO } from "@/server/queries";
import { PageHeader, cn } from "@/components/ui";
import { FilterTabs } from "@/components/filters";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t.calendar.title };
}

const MAX_PER_DAY = 3;

/** Month calendar of task deadlines (weeks start on Sunday). */
export default async function CalendarPage({ searchParams }: PageProps<"/calendar">) {
  const user = await requirePermission("tasks.updateStatus");
  const { t, lang, locale } = await getT();
  const c = t.calendar;
  const sp = await searchParams;
  const parsed = typeof sp.m === "string" ? parse(sp.m, "yyyy-MM", new Date()) : null;
  const today = todayISO();
  const month = parsed && isValid(parsed) ? startOfMonth(parsed) : startOfMonth(parse(today, "yyyy-MM-dd", new Date()));
  const seesAll = can(user, "tasks.assign");
  const who = sp.who === "mine" || !seesAll ? "mine" : "all";

  const gridStart = startOfWeek(month, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
  const tasks = await listTasks(user, {
    dueFrom: format(gridStart, "yyyy-MM-dd"),
    dueTo: format(gridEnd, "yyyy-MM-dd"),
    ...(who === "mine" ? { assigneeId: user.id } : {}),
    orderBy: "due",
  });
  const byDay = new Map<string, typeof tasks>();
  for (const task of tasks) {
    if (!task.dueDate) continue;
    byDay.set(task.dueDate, [...(byDay.get(task.dueDate) ?? []), task]);
  }
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const monthKey = (d: Date) => format(d, "yyyy-MM");
  const href = (m: Date, w = who) => `/calendar?m=${monthKey(m)}${w === "mine" && seesAll ? "&who=mine" : ""}`;
  const Prev = lang === "ar" ? ChevronRight : ChevronLeft;
  const Next = lang === "ar" ? ChevronLeft : ChevronRight;
  const inMonth = tasks.filter((x) => x.dueDate?.startsWith(monthKey(month))).length;

  return (
    <>
      <PageHeader title={c.title} description={c.sub} />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href={href(addMonths(month, -1))} aria-label={c.prev} className="rounded-full border border-zinc-200 bg-white p-2 hover:bg-zinc-50">
            <Prev aria-hidden className="size-4" />
          </Link>
          <h2 className="min-w-40 text-center text-lg font-semibold" data-testid="calendar-month">
            {format(month, "MMMM yyyy", { locale })}
          </h2>
          <Link href={href(addMonths(month, 1))} aria-label={c.next} className="rounded-full border border-zinc-200 bg-white p-2 hover:bg-zinc-50">
            <Next aria-hidden className="size-4" />
          </Link>
          <Link href={`/calendar${who === "mine" && seesAll ? "?who=mine" : ""}`} className="ms-1 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm hover:bg-zinc-50">
            {c.today}
          </Link>
        </div>
        {seesAll && (
          <FilterTabs
            current={who}
            options={[
              { value: "all", label: c.all },
              { value: "mine", label: c.mine },
            ]}
            hrefFor={(v) => `/calendar?m=${monthKey(month)}${v === "mine" ? "&who=mine" : ""}`}
          />
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <div className="grid min-w-[760px] grid-cols-7">
          {c.weekdays.map((d) => (
            <div key={d} className="border-b border-zinc-200 px-2 py-2 text-center text-xs font-medium text-zinc-500">
              {d}
            </div>
          ))}
          {days.map((d) => {
            const key = format(d, "yyyy-MM-dd");
            const items = byDay.get(key) ?? [];
            const outside = monthKey(d) !== monthKey(month);
            const isToday = key === today;
            return (
              <div
                key={key}
                className={cn("min-h-28 border-e border-b border-zinc-100 p-1.5 [&:nth-child(7n)]:border-e-0", outside && "bg-zinc-50/70")}
                data-day={key}
              >
                <div className="mb-1 flex justify-end">
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full text-xs tabular-nums",
                      isToday ? "bg-zinc-900 font-semibold text-white" : outside ? "text-zinc-400" : "text-zinc-700",
                    )}
                  >
                    {format(d, "d")}
                  </span>
                </div>
                <ul className="space-y-1">
                  {items.slice(0, MAX_PER_DAY).map((task) => {
                    const late = key < today && task.status !== "completed";
                    return (
                      <li key={task.id}>
                        <Link
                          href={`/tasks/${task.id}`}
                          title={`${task.title} — ${task.projectName}`}
                          dir="auto"
                          className={cn(
                            "block truncate rounded-md border-s-4 px-1.5 py-1 text-xs leading-tight hover:brightness-95",
                            task.status === "completed" ? "bg-emerald-50 text-emerald-900 line-through decoration-emerald-400" : late ? "bg-red-50 text-red-900" : "bg-zinc-100 text-zinc-800",
                          )}
                          style={{ borderInlineStartColor: task.moduleColor ?? "#a1a1aa" }}
                        >
                          {task.title}
                        </Link>
                      </li>
                    );
                  })}
                  {items.length > MAX_PER_DAY && (
                    <li>
                      <Link href={`/tasks?q=&view=all`} className="block px-1.5 text-xs text-zinc-500 hover:underline">
                        {c.more(items.length - MAX_PER_DAY)}
                      </Link>
                    </li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
      {inMonth === 0 && <p className="mt-3 text-sm text-zinc-500">{c.empty}</p>}
    </>
  );
}
