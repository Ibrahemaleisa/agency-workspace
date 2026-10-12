"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { Paperclip } from "lucide-react";
import { buttonClass, cn } from "./ui";

/**
 * Uploads files from the browser straight to the private file store (no 4.5 MB request limit),
 * then attaches them to the task. Used when Vercel Blob is configured.
 */
export function DirectUpload({
  taskId,
  orgId,
  canShare,
  maxBytes,
  register,
  labels,
}: {
  taskId: string;
  orgId: string;
  canShare: boolean;
  maxBytes: number;
  register: (input: { taskId: string; clientVisible: boolean; files: { key: string; name: string }[] }) => Promise<{ error?: string }>;
  labels: { choose: string; hint: string; chosen: string; upload: string; uploading: string; share: string; tooLarge: string; failed: string };
}) {
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [names, setNames] = useState<string[]>([]);
  const [share, setShare] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    const files = Array.from(input.current?.files ?? []);
    if (files.length === 0) return;
    if (files.some((f) => f.size > maxBytes)) {
      setError(labels.tooLarge);
      return;
    }
    setBusy(true);
    setError(null);
    setProgress(0);
    const total = files.reduce((n, f) => n + f.size, 0) || 1;
    let done = 0;
    try {
      const stored: { key: string; name: string }[] = [];
      for (const file of files) {
        const safe = file.name.replace(/[^\w.\-]+/g, "_").slice(-100) || "file";
        const result = await upload(`${orgId}/${safe}`, file, {
          access: "private",
          handleUploadUrl: "/api/uploads",
          clientPayload: JSON.stringify({ taskId, size: file.size }),
          contentType: file.type || undefined,
          multipart: file.size > 8 * 1024 * 1024,
          onUploadProgress: ({ loaded }) => setProgress(Math.round(((done + loaded) / total) * 100)),
        });
        done += file.size;
        stored.push({ key: result.pathname, name: file.name });
      }
      const res = await register({ taskId, clientVisible: share, files: stored });
      if (res.error) setError(res.error);
      else {
        if (input.current) input.current.value = "";
        setNames([]);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : labels.failed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-zinc-100 px-4 py-3">
      {error && (
        <div role="alert" className="w-full rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      <label className="flex min-w-56 flex-1 cursor-pointer items-center gap-3 rounded-lg border border-dashed border-zinc-300 bg-white px-3 py-2.5 text-sm hover:border-zinc-400">
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-ink px-3 py-1.5 font-medium text-white">
          <Paperclip aria-hidden className="size-3.5" />
          {labels.choose}
        </span>
        <span className="min-w-0 truncate text-zinc-500" dir="auto">
          {names.length === 0 ? labels.hint : names.length === 1 ? names[0] : labels.chosen.replace("{n}", String(names.length))}
        </span>
        <input
          ref={input}
          type="file"
          multiple
          className="sr-only"
          onChange={() => setNames(Array.from(input.current?.files ?? [], (f) => f.name))}
        />
      </label>
      {canShare && (
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} className="size-4 accent-indigo-600" />
          {labels.share}
        </label>
      )}
      <button type="button" disabled={busy || names.length === 0} onClick={send} className={cn(buttonClass("secondary", "sm"))}>
        {busy ? `${labels.uploading} ${progress}%` : labels.upload}
      </button>
    </div>
  );
}
