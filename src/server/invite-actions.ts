"use server";

import { revalidatePath } from "next/cache";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { accounts, clients, invitations, organizations, roleEnum, users, type Role } from "@/db/schema";
import { ensureAccount } from "@/db/accounts";
import { hashPassword, hashToken, newToken, requireUser, verifyAccount } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";
import { logActivity } from "@/lib/events";
import { idOf, optId, str, type ActionState } from "@/lib/action-state";
import { emailEnabled, notificationEmail, sendEmail } from "@/lib/email";
import { orgBrand } from "@/lib/brand";
import { tenantBaseUrl } from "@/lib/platform";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { getSaasT } from "@/lib/i18n-saas";
import { parseFocus, startOnboarding } from "@/lib/onboarding";
import { enterWorkspace } from "@/lib/handoff";
import { getHostTenant } from "@/lib/tenant";
import { teamLimitError } from "@/lib/limits";

const INVITE_DAYS = 7;
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 200;

function parseRole(v: string | null): Role {
  return v && (roleEnum.enumValues as string[]).includes(v) ? (v as Role) : "employee";
}

/** Admin: invite someone by email. Returns the link so it can be shared even without email set up. */
export async function createInvitation(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireUser();
  assertCan(admin, "users.invite");
  const { t } = await getSaasT();
  const e = t.invite.errors;

  const email = str(fd, "email")?.toLowerCase() ?? "";
  if (!isEmail(email)) return { error: e.email };
  const role = parseRole(str(fd, "role"));
  const clientId = role === "client" ? optId(fd, "clientId") : null;
  if (role === "client") {
    const c = clientId && (await db.query.clients.findFirst({ where: and(eq(clients.id, clientId), eq(clients.orgId, admin.orgId)) }));
    if (!c) return { error: e.client };
  }
  // Already in this agency? (Belonging to other agencies is fine: they'll join with their own password.)
  if (await db.query.users.findFirst({ where: and(eq(users.orgId, admin.orgId), eq(users.email, email)) })) return { error: e.exists };
  if (role !== "client") {
    const limit = await teamLimitError(admin.orgId);
    if (limit) return { error: limit };
  }
  if (!(await rateLimit(`invite:${admin.orgId}`, 50, 3600))) return { error: e.rate };

  // One live invitation per address: re-inviting replaces the previous link.
  await db
    .update(invitations)
    .set({ revokedAt: new Date() })
    .where(and(eq(invitations.orgId, admin.orgId), eq(invitations.email, email), isNull(invitations.acceptedAt), isNull(invitations.revokedAt)));

  const token = newToken();
  const [created] = await db.insert(invitations).values({
    orgId: admin.orgId,
    email,
    role,
    clientId,
    focus: role === "employee" ? parseFocus(str(fd, "focus")) : null,
    title: str(fd, "title")?.slice(0, 120) ?? null,
    tokenHash: hashToken(token),
    invitedById: admin.id,
    expiresAt: new Date(Date.now() + INVITE_DAYS * 86_400_000),
  }).returning({ id: invitations.id });

  const org = (await db.query.organizations.findFirst({ where: eq(organizations.id, admin.orgId) }))!;
  const link = `${tenantBaseUrl(org)}/invite/${token}`;
  let emailed = false;
  if (emailEnabled() && !org.isDemo) {
    try {
      const brand = orgBrand(org);
      const lang = brand.defaultLang;
      const ti = (await getSaasT(lang)).t.invite;
      await sendEmail({
        to: email,
        ...notificationEmail({
          lang,
          title: ti.emailTitle(admin.name, brand.name[lang]),
          body: ti.emailBody,
          link: `/invite/${token}`,
          brand,
          baseUrl: tenantBaseUrl(org),
          footer: ti.emailFooter(INVITE_DAYS),
          cta: ti.emailCta,
        }),
      });
      emailed = true;
      // Delivered to that inbox: accepting it will also confirm the address.
      await db.update(invitations).set({ emailedAt: new Date() }).where(eq(invitations.id, created.id));
    } catch (err) {
      console.error("[invite email failed]", err);
    }
  }
  await logActivity(admin, { action: "user.invited", summary: `invited ${email} (${role})`, params: { email, role } });
  revalidatePath("/team");
  return { ok: true, link: emailed ? undefined : link };
}

export async function revokeInvitation(fd: FormData) {
  const admin = await requireUser();
  assertCan(admin, "users.invite");
  await db
    .update(invitations)
    .set({ revokedAt: new Date() })
    .where(and(eq(invitations.id, idOf(fd, "id")), eq(invitations.orgId, admin.orgId), isNull(invitations.acceptedAt)));
  revalidatePath("/team");
}

/** A live invitation for this token, with its tenant and whether the invitee already has an account. */
export async function findInvitation(token: string) {
  if (!token || token.length > 100) return null;
  const [row] = await db
    .select({ invite: invitations, org: organizations })
    .from(invitations)
    .innerJoin(organizations, eq(organizations.id, invitations.orgId))
    .where(
      and(
        eq(invitations.tokenHash, hashToken(token)),
        isNull(invitations.acceptedAt),
        isNull(invitations.revokedAt),
        gt(invitations.expiresAt, new Date()),
      ),
    )
    .limit(1);
  if (!row || row.org.status !== "active" || row.org.isDemo) return null;
  const host = await getHostTenant();
  if (host && host.id !== row.org.id) return null;
  const account = await db.query.accounts.findFirst({ where: eq(accounts.email, row.invite.email), columns: { id: true } });
  return { ...row, hasAccount: !!account };
}

/**
 * Public: joining through an invitation.
 * - New to Operra: they choose a name and password, which creates their account.
 * - Already on Operra (another agency): they confirm with their existing password — an invitation
 *   link alone can never set or replace someone's password.
 */
export async function acceptInvitation(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { t } = await getSaasT();
  const e = t.invite.errors;
  if (!(await rateLimit(`accept:${await clientIp()}`, 20, 900))) return { error: e.rate };
  const token = str(fd, "token") ?? "";
  const name = str(fd, "name")?.slice(0, 120);
  const password = str(fd, "password") ?? "";
  if (!name) return { error: e.name };

  const found = await findInvitation(token);
  if (!found) return { error: e.invalid };
  const { invite, org } = found;
  if (await db.query.users.findFirst({ where: and(eq(users.orgId, org.id), eq(users.email, invite.email)) })) return { error: e.exists };
  if (invite.role !== "client") {
    // The invitation itself was counted when it was sent; only people already in count here.
    const limit = await teamLimitError(org.id, { countInvites: false });
    if (limit) return { error: limit };
  }

  let passwordHash: string;
  if (found.hasAccount) {
    const account = await verifyAccount(invite.email, password);
    if (!account) return { error: e.accountPassword };
    passwordHash = account.passwordHash;
  } else {
    if (password.length < 8) return { error: e.password };
    passwordHash = await hashPassword(password);
  }

  const user = await db.transaction(async (tx) => {
    // Claim the invitation first: a second submit (or a race) can't create a second membership.
    const [claimed] = await tx
      .update(invitations)
      .set({ acceptedAt: new Date() })
      .where(and(eq(invitations.id, invite.id), isNull(invitations.acceptedAt), isNull(invitations.revokedAt)))
      .returning({ id: invitations.id });
    if (!claimed) return null;
    const { account } = await ensureAccount(tx, invite.email, passwordHash);
    // The account created or proven above must be the one we insert for (no swap in between).
    if (account.passwordHash !== passwordHash) return null;
    if (invite.emailedAt && !account.emailVerifiedAt) {
      await tx.update(accounts).set({ emailVerifiedAt: new Date() }).where(eq(accounts.id, account.id));
    }
    const [u] = await tx
      .insert(users)
      .values({
        orgId: org.id,
        accountId: account.id,
        name,
        email: account.email,
        role: invite.role,
        title: invite.title,
        focus: invite.focus,
        clientId: invite.clientId,
        lang: str(fd, "lang") === "ar" ? "ar" : "en",
      })
      .returning();
    return u;
  });
  if (!user) return { error: e.invalid };

  await startOnboarding(user);
  await logActivity({ ...user, readOnly: false }, { action: "user.joined", summary: `${name} joined the workspace`, params: {} });
  return enterWorkspace(user, org);
}
