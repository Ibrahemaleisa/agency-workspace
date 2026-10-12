"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { Paperclip } from "lucide-react";
import { cn } from "./ui";

/**
 * File input whose words follow the page's language (the native control's text follows the
 * browser's, so Arabic pages showed "Choose Files / No file chosen"). Also accepts files dropped on it.
 */
export function FilePicker({
  name,
  multiple,
  required,
  accept,
  labels,
  className,
}: {
  name: string;
  multiple?: boolean;
  required?: boolean;
  accept?: string;
  /** `chosen` is a template with {n} for the number of files. */
  labels: { choose: string; hint: string; chosen: string };
  className?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<string[]>([]);
  const [over, setOver] = useState(false);

  // Clear the summary when the form resets (e.g. after a successful upload).
  useEffect(() => {
    const form = input.current?.form;
    if (!form) return;
    const clear = () => setFiles([]);
    form.addEventListener("reset", clear);
    return () => form.removeEventListener("reset", clear);
  }, []);

  const sync = () => setFiles(Array.from(input.current?.files ?? [], (f) => f.name));

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    if (!input.current || !e.dataTransfer.files.length) return;
    const dt = new DataTransfer();
    for (const f of Array.from(e.dataTransfer.files).slice(0, multiple ? undefined : 1)) dt.items.add(f);
    input.current.files = dt.files;
    sync();
  };

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      className={cn(
        "flex min-w-0 cursor-pointer items-center gap-3 rounded-lg border border-dashed bg-white px-3 py-2.5 text-sm transition focus-within:ring-2 focus-within:ring-indigo-500",
        over ? "border-indigo-600 bg-indigo-50" : "border-zinc-300 hover:border-zinc-400",
        className,
      )}
    >
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-ink px-3 py-1.5 font-medium text-white">
        <Paperclip aria-hidden className="size-3.5" />
        {labels.choose}
      </span>
      <span className="min-w-0 truncate text-zinc-500" dir="auto" title={files.join(", ") || undefined}>
        {files.length === 0 ? labels.hint : files.length === 1 ? files[0] : labels.chosen.replace("{n}", String(files.length))}
      </span>
      <input
        ref={input}
        type="file"
        name={name}
        multiple={multiple}
        required={required}
        accept={accept}
        onChange={sync}
        className="sr-only"
      />
    </label>
  );
}
