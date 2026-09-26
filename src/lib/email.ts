import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { appUrl } from "./platform";

/**
 * Outgoing email, chosen by environment:
 * - Resend when RESEND_API_KEY is set;
 * - any SMTP server (Gmail, Outlook, Zoho…) when SMTP_HOST is set;
 * - otherwise emails are skipped (and logged), so the app keeps working without mail setup.
 */
export type Email = { to: string; subject: string; html: string; text: string };

const from = () => process.env.EMAIL_FROM || process.env.SMTP_USER || "onboarding@resend.dev";

export const emailEnabled = () => !!(process.env.RESEND_API_KEY || process.env.SMTP_HOST);

let transporter: Transporter | null = null;
function smtp() {
  transporter ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: (process.env.SMTP_PORT || "465") === "465",
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  return transporter;
}

export async function sendEmail(email: Email) {
  if (process.env.RESEND_API_KEY) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: from(), ...email }),
    });
    if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
    return;
  }
  if (process.env.SMTP_HOST) {
    await smtp().sendMail({ from: from(), ...email });
    return;
  }
  console.info(`[email skipped: no RESEND_API_KEY or SMTP_HOST] to=${email.to} subject=${email.subject}`);
}

export { appUrl } from "./platform";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Branded notification email (black header, beige button), in the recipient's language. */
export function notificationEmail(opts: {
  lang: "ar" | "en";
  title: string;
  body?: string | null;
  link?: string | null;
  /** The agency's name and colours (from lib/brand.ts). */
  brand: { name: { en: string; ar: string }; primary: string; accent: string };
  /** Where the tenant's workspace lives (subdomain, custom domain or the app URL). */
  baseUrl?: string;
  /** Overrides for non-notification emails (invitations, sign-up). */
  cta?: string;
  footer?: string;
}): Omit<Email, "to"> {
  const { primary, accent } = opts.brand;
  const brandName = opts.brand.name[opts.lang];
  const ar = opts.lang === "ar";
  const dir = ar ? "rtl" : "ltr";
  const base = opts.baseUrl ?? appUrl();
  const url = opts.link ? `${base}${opts.link}` : base;
  const cta = opts.cta ?? (ar ? `افتح في ${brandName}` : `Open in ${brandName}`);
  const footer = opts.footer ?? (ar
    ? "وصلك هذا البريد لأن إشعارات البريد مفعّلة في حسابك. يمكنك إيقافها من صفحة الإشعارات."
    : "You received this because email notifications are on for your account. You can turn them off on the Notifications page.");
  const font = ar ? "Tahoma, 'Segoe UI', Arial, sans-serif" : "'Helvetica Neue', Arial, sans-serif";
  const html = `<!doctype html><html lang="${opts.lang}" dir="${dir}"><body style="margin:0;background:#f6f5f2;font-family:${font}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f5f2;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e7e5e4">
<tr><td style="background:${primary};padding:18px 24px;color:${accent};font-size:18px;font-weight:700;letter-spacing:.3px" dir="${dir}">${esc(brandName)}</td></tr>
<tr><td style="padding:24px" dir="${dir}" align="${ar ? "right" : "left"}">
<div style="font-size:17px;font-weight:700;color:#18181b;line-height:1.5">${esc(opts.title)}</div>
${opts.body ? `<div style="margin-top:12px;padding:12px 14px;background:#f7f7f5;border-${ar ? "right" : "left"}:3px solid ${accent};border-radius:8px;color:#3f3f46;font-size:14px;line-height:1.7;white-space:pre-wrap">${esc(opts.body)}</div>` : ""}
<div style="margin-top:20px"><a href="${esc(url)}" style="display:inline-block;background:${primary};color:${accent};text-decoration:none;padding:10px 18px;border-radius:999px;font-size:14px;font-weight:600">${cta}</a></div>
</td></tr>
<tr><td style="padding:14px 24px;border-top:1px solid #f4f4f5;color:#a1a1aa;font-size:12px;line-height:1.6" dir="${dir}" align="${ar ? "right" : "left"}">${footer}</td></tr>
</table></td></tr></table></body></html>`;
  const text = `${opts.title}\n\n${opts.body ? opts.body + "\n\n" : ""}${cta}: ${url}\n\n${footer}`;
  return { subject: opts.title, html, text };
}
