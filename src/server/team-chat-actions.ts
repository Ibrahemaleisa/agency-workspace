"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { teamMessages } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";
import { listStaffIds, notify, resolveMentions } from "@/lib/events";
import { nt } from "@/lib/notify-text";
import { str, type ActionState } from "@/lib/action-state";
import { listInternalUsers } from "@/server/queries";
import { getT } from "@/lib/lang";

const EVERYONE = /(^|\s)@(all|everyone|الكل|الجميع)(?=$|[\s.,!?؟،])/iu;

export async function sendTeamMessage(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  assertCan(user, "chat.internal");
  const body = str(fd, "body");
  if (!body) return { error: (await getT()).t.actions.messageEmpty };

  await db.insert(teamMessages).values({ orgId: user.orgId, authorId: user.id, body });

  // Only @mentions (or @all) send notifications, so the team isn't flooded by every message.
  const link = "/chat";
  if (EVERYONE.test(body)) {
    await notify(user, await listStaffIds(user.orgId), { type: "team_chat", title: nt.teamChatAll(user.name), body, link });
  } else {
    const mentioned = resolveMentions(body, await listInternalUsers(user.orgId));
    await notify(user, mentioned, { type: "team_chat", title: nt.teamChatMention(user.name), body, link });
  }
  revalidatePath("/chat");
  return { ok: true };
}
