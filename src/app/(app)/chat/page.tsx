import { desc, eq } from "drizzle-orm";
import { format, isToday } from "date-fns";
import { db } from "@/db";
import { teamMessages, users } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { getT } from "@/lib/lang";
import { sendTeamMessage } from "@/server/team-chat-actions";
import { ActionForm, AutoRefresh, SubmitButton } from "@/components/forms";
import { Avatar, Badge, EmptyState, PageHeader, Textarea, cn } from "@/components/ui";
import { Highlight } from "@/components/project-chat";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t.teamChat.title };
}

export default async function TeamChatPage() {
  const user = await requirePermission("chat.internal");
  const { t, locale } = await getT();

  const recent = await db
    .select({
      id: teamMessages.id,
      body: teamMessages.body,
      createdAt: teamMessages.createdAt,
      authorId: teamMessages.authorId,
      authorName: users.name,
      authorRole: users.role,
      authorTitle: users.title,
    })
    .from(teamMessages)
    .leftJoin(users, eq(users.id, teamMessages.authorId))
    .where(eq(teamMessages.orgId, user.orgId))
    .orderBy(desc(teamMessages.createdAt))
    .limit(200);
  const messages = recent.reverse();

  // Opening the chat marks it as read.
  await db.update(users).set({ teamChatSeenAt: new Date() }).where(eq(users.id, user.id));

  return (
    <>
      <PageHeader title={t.teamChat.title} description={t.teamChat.subtitle} />
      <div className="flex h-[calc(100dvh-17rem)] min-h-[440px] flex-col overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgb(0_0_0/0.04)] md:h-[calc(100dvh-15rem)]">
        <AutoRefresh intervalMs={5000} />
        <div className="flex flex-1 flex-col-reverse overflow-y-auto bg-zinc-50/60 px-3 py-4 md:px-5">
          {messages.length === 0 ? (
            <EmptyState>{t.teamChat.empty}</EmptyState>
          ) : (
            <ul className="space-y-3">
              {messages.map((m, i) => {
                const mine = m.authorId === user.id;
                const grouped = messages[i - 1]?.authorId === m.authorId;
                return (
                  <li key={m.id} className={cn("flex items-end gap-2", mine && "flex-row-reverse", grouped && "-mt-2")}>
                    <span className={cn("shrink-0", (mine || grouped) && "invisible")}>
                      <Avatar name={m.authorName} size="md" />
                    </span>
                    <div className={cn("flex max-w-[80%] flex-col", mine ? "items-end" : "items-start")}>
                      {!grouped && !mine && (
                        <div className="mb-1 flex items-center gap-1.5 px-1 text-xs">
                          <span className="font-medium text-zinc-700">{m.authorName ?? t.common.deletedUser}</span>
                          {m.authorRole === "admin" && <Badge>{t.roles.admin}</Badge>}
                          {m.authorTitle && <span className="text-zinc-400">{m.authorTitle}</span>}
                        </div>
                      )}
                      <div
                        dir="auto"
                        className={cn(
                          "rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap shadow-sm",
                          mine
                            ? "rounded-ee-md bg-indigo-600 text-white [&_span]:text-sand-200"
                            : "rounded-es-md border border-zinc-200/80 bg-white text-zinc-800",
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
        <ActionForm action={sendTeamMessage} resetOnSuccess className="border-t border-zinc-100 p-3">
          <div className="flex items-end gap-2">
            <Textarea name="body" rows={1} className="rounded-2xl" required placeholder={t.teamChat.placeholder} />
            <SubmitButton pendingText={t.chat.sending}>{t.chat.send}</SubmitButton>
          </div>
          <p className="mt-1.5 px-1 text-[11px] text-zinc-400">{t.teamChat.hint}</p>
        </ActionForm>
      </div>
    </>
  );
}
