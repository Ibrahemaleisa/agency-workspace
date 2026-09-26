import "server-only";
import nodemailer from "nodemailer";

/**
 * Where form submissions go. Configure one or more (see site/README.md):
 * - INQUIRY_TO + RESEND_API_KEY        → email via Resend
 * - INQUIRY_TO + SMTP_HOST (+ user/pass) → email via any SMTP server
 * - INQUIRY_WEBHOOK_URL                 → JSON POST (Slack/Zapier/Make/CRM)
 */
export type Inquiry = { kind: "trial" | "contact"; fields: Record<string, string> };

const from = () => process.env.EMAIL_FROM || process.env.SMTP_USER || "Operra website <onboarding@resend.dev>";

export const deliveryConfigured = () =>
  !!process.env.INQUIRY_WEBHOOK_URL || (!!process.env.INQUIRY_TO && !!(process.env.RESEND_API_KEY || process.env.SMTP_HOST));

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function render(inq: Inquiry) {
  const subject =
    inq.kind === "trial"
      ? `Trial request: ${inq.fields.Agency ?? inq.fields.Name}`
      : `Website enquiry: ${inq.fields.Topic ?? "General"} — ${inq.fields.Name}`;
  const rows = Object.entries(inq.fields).filter(([, v]) => v);
  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n");
  const html = `<table cellpadding="6" style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">${rows
    .map(
      ([k, v]) =>
        `<tr><td style="color:#6b675f;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="white-space:pre-wrap">${esc(v)}</td></tr>`,
    )
    .join("")}</table>`;
  return { subject, text, html };
}

export async function deliverInquiry(inq: Inquiry, replyTo: string) {
  const tasks: Promise<unknown>[] = [];
  const to = process.env.INQUIRY_TO;
  const mail = render(inq);

  if (to && process.env.RESEND_API_KEY) {
    tasks.push(
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: from(), to, reply_to: replyTo, ...mail }),
      }).then(async (r) => {
        if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`);
      }),
    );
  } else if (to && process.env.SMTP_HOST) {
    const port = Number(process.env.SMTP_PORT || 465);
    tasks.push(
      nodemailer
        .createTransport({
          host: process.env.SMTP_HOST,
          port,
          secure: port === 465,
          auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
        })
        .sendMail({ from: from(), to, replyTo, ...mail }),
    );
  }

  if (process.env.INQUIRY_WEBHOOK_URL) {
    tasks.push(
      fetch(process.env.INQUIRY_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: inq.kind, text: `${mail.subject}\n${mail.text}`, fields: inq.fields }),
      }).then((r) => {
        if (!r.ok) throw new Error(`Webhook ${r.status}`);
      }),
    );
  }

  if (tasks.length === 0) {
    // Local development without configuration: log instead of failing.
    console.info(`[inquiry not delivered: no INQUIRY_TO/RESEND_API_KEY/SMTP_HOST/INQUIRY_WEBHOOK_URL]\n${mail.subject}\n${mail.text}`);
    return;
  }
  const results = await Promise.allSettled(tasks);
  const failed = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
  failed.forEach((f) => console.error("[inquiry delivery failed]", f.reason));
  // One working channel is enough; fail only if every channel failed.
  if (failed.length === results.length) throw new Error("All delivery channels failed");
}
