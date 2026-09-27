"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { CalendarClock } from "lucide-react";
import type { TaskStatus } from "@/db/schema";
import { cn } from "./ui";

export type BoardTask = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: string;
  dueDate: string | null;
  projectName: string;
  clientName: string | null;
  assigneeName: string | null;
  moduleColor: string | null;
};

type Column = { value: TaskStatus; label: string; tone: string };

const TONE_BAR: Record<string, string> = {
  slate: "bg-zinc-400",
  blue: "bg-sky-500",
  violet: "bg-violet-500",
  amber: "bg-amber-500",
  green: "bg-emerald-500",
  red: "bg-red-500",
};

/**
 * Kanban board: one column per status. Drag a card to another column (or use its "Move to" menu,
 * which also works on phones and with the keyboard) — the change is saved at once and shown
 * immediately, with the usual notifications and activity log entry on the server.
 */
export function TaskBoard({
  columns,
  tasks,
  move,
  canMove,
  today,
  labels,
}: {
  columns: Column[];
  tasks: BoardTask[];
  move: (fd: FormData) => Promise<void>;
  canMove: boolean;
  today: string;
  labels: { moveTo: string; empty: string; overdue: string; unassigned: string };
}) {
  const [optimistic, setOptimistic] = useOptimistic(tasks, (state: BoardTask[], m: { id: string; status: TaskStatus }) =>
    state.map((t) => (t.id === m.id ? { ...t, status: m.status } : t)),
  );
  const [, startTransition] = useTransition();
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<TaskStatus | null>(null);

  const moveTask = (id: string, status: TaskStatus) => {
    const task = optimistic.find((t) => t.id === id);
    if (!task || task.status === status) return;
    startTransition(async () => {
      setOptimistic({ id, status });
      const fd = new FormData();
      fd.set("taskId", id);
      fd.set("status", status);
      await move(fd);
    });
  };

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0" data-testid="task-board">
      <div className="flex min-w-max gap-3">
        {columns.map((col) => {
          const items = optimistic.filter((t) => t.status === col.value);
          return (
            <section
              key={col.value}
              aria-label={col.label}
              data-status={col.value}
              onDragOver={(e) => {
                if (!canMove || !dragging) return;
                e.preventDefault();
                setOver(col.value);
              }}
              onDragLeave={() => setOver((o) => (o === col.value ? null : o))}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/plain") || dragging;
                setOver(null);
                setDragging(null);
                if (id) moveTask(id, col.value);
              }}
              className={cn(
                "flex w-64 shrink-0 flex-col rounded-xl border bg-zinc-50/80 transition",
                over === col.value ? "border-zinc-900 bg-zinc-100" : "border-zinc-200",
              )}
            >
              <header className="flex items-center gap-2 px-3 pt-3 pb-2">
                <span aria-hidden className={cn("size-2 rounded-full", TONE_BAR[col.tone] ?? "bg-zinc-400")} />
                <h2 className="text-sm font-semibold">{col.label}</h2>
                <span className="ms-auto rounded-full bg-white px-2 py-0.5 text-xs text-zinc-500 tabular-nums">{items.length}</span>
              </header>
              <ul className="flex min-h-24 flex-1 flex-col gap-2 px-2 pb-2">
                {items.map((t) => {
                  const overdue = !!t.dueDate && t.dueDate < today && t.status !== "completed";
                  return (
                    <li
                      key={t.id}
                      draggable={canMove}
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", t.id);
                        e.dataTransfer.effectAllowed = "move";
                        setDragging(t.id);
                      }}
                      onDragEnd={() => {
                        setDragging(null);
                        setOver(null);
                      }}
                      className={cn(
                        "rounded-lg border border-zinc-200 bg-white p-3 shadow-sm",
                        canMove && "cursor-grab active:cursor-grabbing",
                        dragging === t.id && "opacity-50",
                      )}
                      data-testid="board-card"
                    >
                      <div className="flex items-start gap-2">
                        {t.moduleColor && <span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full" style={{ background: t.moduleColor }} />}
                        <Link href={`/tasks/${t.id}`} dir="auto" className="min-w-0 flex-1 text-sm font-medium leading-snug hover:underline">
                          {t.title}
                        </Link>
                      </div>
                      <p className="mt-1 truncate text-xs text-zinc-500">
                        {t.clientName ? `${t.clientName} · ` : ""}
                        {t.projectName}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-600">{t.assigneeName ?? labels.unassigned}</span>
                        {t.dueDate && (
                          <span className={cn("inline-flex items-center gap-1", overdue ? "font-medium text-red-700" : "text-zinc-500")}>
                            <CalendarClock aria-hidden className="size-3.5" />
                            {t.dueDate}
                            {overdue && <span className="sr-only"> ({labels.overdue})</span>}
                          </span>
                        )}
                      </div>
                      {canMove && (
                        <label className="mt-2 block">
                          <span className="sr-only">{labels.moveTo}</span>
                          <select
                            value={t.status}
                            onChange={(e) => moveTask(t.id, e.target.value as TaskStatus)}
                            className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-600"
                            aria-label={`${labels.moveTo}: ${t.title}`}
                          >
                            {columns.map((c) => (
                              <option key={c.value} value={c.value}>
                                {c.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}
                    </li>
                  );
                })}
                {items.length === 0 && <li className="px-2 py-6 text-center text-xs text-zinc-400">{labels.empty}</li>}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
