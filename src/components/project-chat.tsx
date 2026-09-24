import Link from "next/link";
import { format, isToday } from "date-fns";
import { Lock, Users } from "lucide-react";
import { sendChatMessage } from "@/server/project-actions";
import { ActionForm, AutoRefresh, SubmitButton } from "./forms";
import { Avatar, Badge, EmptyState, Textarea, cn } from "./ui";
import { getT } from "@/lib/lang";

export type ChatMessage = {
  id: string;
  body: string;
  createdAt: Date;
  authorName: string | null;
  authorRole: string | null;
};

export async function ProjectChat({
  projectId,
  channel,
  channels,
  messages,
  currentUserName,
}: {
  projectId: string;
  channel: "internal" | "client";
  channels: ("internal" | "client")[];
  messages: ChatMessage[];
  currentUserName: string;
}) {
  const { t, locale } = await getT();
  return (
    <div className="flex h-[calc(100dvh-22rem)] min-h-[440px] flex-col md:h-[calc(100dvh-18rem)] overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
      <AutoRefresh intervalMs={5000} />
      <div className="flex items-center justify-between gap-2 border-b border-zinc-100 px-4 py-2">
        <div className="flex gap-1">
          {channels.map((c) => (
            <Link
              key={c}
              href={`/projects/${projectId}?tab=chat&channel=${c}`}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium",
                c === channel ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900",
              )}
            >
              {c === "internal" ? <Lock className="size-3.5" /> : <Users className="size-3.5" />}
              {c === "internal" ? t.chat.team : t.chat.client}
              <span className="hidden sm:inline">{c === "internal" ? t.chat.teamSuffix : t.chat.clientSuffix}</span>
            </Link>
          ))}
        </div>
        <span className="hidden text-xs text-zinc-400 sm:block">
          {channel === "internal" ? t.chat.internalHint : t.chat.clientHint}
        </span>
      </div>

      {/* flex-col-reverse keeps the view anchored to the newest message */}
      <div className="flex flex-1 flex-col-reverse overflow-y-auto bg-zinc-50/60 px-3 py-4 md:px-5">
        {messages.length === 0 ? (
          <EmptyState>{t.chat.empty}</EmptyState>
        ) : (
          <ul className="space-y-3">
            {messages.map((m, i) => {
              const mine = m.authorName === currentUserName;
              const grouped = messages[i - 1]?.authorName === m.authorName;
              return (
                <li key={m.id} className={cn("flex items-end gap-2", mine && "flex-row-reverse", grouped && "-mt-2")}>
                  <span className={cn("shrink-0", (mine || grouped) && "invisible")}>
                    <Avatar name={m.authorName} size="md" />
                  </span>
                  <div className={cn("flex max-w-[80%] flex-col", mine ? "items-end" : "items-start")}>
                    {!grouped && !mine && (
                      <div className="mb-1 flex items-center gap-1.5 px-1 text-xs">
                        <span className="font-medium text-zinc-700">{m.authorName ?? t.common.deletedUser}</span>
                        {m.authorRole === "client" && <Badge tone="amber">{t.chat.clientBadge}</Badge>}
                      </div>
                    )}
                    <div
                      dir="auto"
                      className={cn(
                        "rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap shadow-sm",
                        mine ? "rounded-ee-md bg-indigo-600 text-white [&_span]:text-indigo-100" : "rounded-es-md border border-zinc-200/80 bg-white text-zinc-800",
                      )}
                    >
                      <Highlight text={m.body} />
                    </div>
                    <span className="mt-1 px-1 text-[11px] text-zinc-400">
                      {format(m.createdAt, isToday(m.createdAt) ? "h:mm a" : "MMM d, h:mm a", { locale })}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ActionForm action={sendChatMessage} resetOnSuccess className="border-t border-zinc-100 p-3">
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="channel" value={channel} />
        <div className="flex items-end gap-2">
          <Textarea
            name="body"
            rows={1}
            className="rounded-2xl"
            required
            placeholder={channel === "internal" ? t.chat.placeholderTeam : t.chat.placeholderClient}
          />
          <SubmitButton pendingText={t.chat.sending}>{t.chat.send}</SubmitButton>
        </div>
      </ActionForm>
    </div>
  );
}

/** Render @mentions in bold. */
export function Highlight({ text }: { text: string }) {
  const parts = text.split(/(@[\p{L}][\p{L}.\-]*)/gu);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("@") ? (
          <span key={i} className="font-medium text-indigo-600">
            {p}
          </span>
        ) : (
          p
        ),
      )}
    </>
  );
}
