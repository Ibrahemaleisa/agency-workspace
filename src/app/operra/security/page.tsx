import { eq } from "drizzle-orm";
import QRCode from "qrcode";
import { db } from "@/db";
import { platformAdmins } from "@/db/schema";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { newTotpSecret, otpauthUrl } from "@/lib/totp";
import { confirmTotpEnrollment } from "@/server/platform-admin-actions";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Field, Input } from "@/components/ui";
import { ControlHeader } from "@/components/platform/control-header";

/**
 * Two-step sign-in for Operra staff. Required: until an authenticator is set up, this is the only
 * control-center page that opens.
 */
export default async function ControlSecurity() {
  const admin = await requirePlatformAdmin({ enrolling: true });
  let row = (await db.query.platformAdmins.findFirst({ where: eq(platformAdmins.id, admin.id) }))!;
  if (!row.totpEnabledAt && !row.totpSecret) {
    // A secret waiting to be confirmed; it only takes effect once a correct code is entered.
    [row] = await db.update(platformAdmins).set({ totpSecret: newTotpSecret() }).where(eq(platformAdmins.id, admin.id)).returning();
  }
  const enrolled = !!row.totpEnabledAt;
  const uri = enrolled ? null : otpauthUrl(row.totpSecret!, row.email);
  const qr = uri ? await QRCode.toString(uri, { type: "svg", margin: 1, width: 200 }) : null;

  return (
    <>
      {enrolled && <ControlHeader name={admin.name} />}
      <main className="mx-auto max-w-xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">Two-step sign-in</h1>
        {enrolled ? (
          <p className="mt-3 text-sm text-[#5B606B]">
            On. Every sign-in to the control center asks for a code from your authenticator app. Lost your phone? Run{" "}
            <code className="rounded bg-white px-1">PLATFORM_ADMIN_RESET_2FA=true npm run platform:admin -- {row.email}</code> with a new
            password to set up a new one.
          </p>
        ) : (
          <div className="mt-4 space-y-5 rounded-xl border border-[#E1E2DE] bg-white p-6 text-sm">
            <p>
              The control center can activate plans, delete workspaces and see every customer, so it needs a second step. Scan this
              code with an authenticator app (Google Authenticator, 1Password, Microsoft Authenticator, Authy…), then enter the
              6-digit code it shows.
            </p>
            {/* QR code SVG generated on the server from our own otpauth link. */}
            <div className="mx-auto w-[200px]" dangerouslySetInnerHTML={{ __html: qr! }} />
            <p className="text-xs text-[#5B606B]">
              Can’t scan? Enter this key by hand:{" "}
              <code className="rounded bg-[#F7F7F4] px-1 font-mono break-all" dir="ltr">
                {row.totpSecret!.replace(/(.{4})/g, "$1 ").trim()}
              </code>
            </p>
            <ActionForm action={confirmTotpEnrollment} className="space-y-3">
              <Field label="Code from the app">
                <Input name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={7} required dir="ltr" />
              </Field>
              <SubmitButton>Turn on two-step sign-in</SubmitButton>
            </ActionForm>
          </div>
        )}
      </main>
    </>
  );
}
