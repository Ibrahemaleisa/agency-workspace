import "server-only";
import { format } from "date-fns";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { invoices, organizations, plans, users } from "@/db/schema";
import { OPERRA_BRAND } from "../brand";
import { emailEnabled, notificationEmail, sendEmail } from "../email";
import { tenantBaseUrl } from "../platform";

export function formatMoney(amountCents: number, currency: string, lang: string) {
  return new Intl.NumberFormat(lang === "ar" ? "ar-SA" : "en", {
    style: "currency",
    currency,
    maximumFractionDigits: amountCents % 100 ? 2 : 0,
  }).format(amountCents / 100);
}

/**
 * Emails a paid invoice to the agency's admins, each in their own language, once.
 * Without email configured it does nothing (the invoice is still listed on the billing page).
 */
export async function sendInvoiceEmail(invoiceId: string) {
  if (!emailEnabled()) return;
  try {
    const inv = await db.query.invoices.findFirst({ where: eq(invoices.id, invoiceId) });
    if (!inv || inv.emailedAt) return;
    const org = await db.query.organizations.findFirst({ where: eq(organizations.id, inv.orgId) });
    if (!org) return;
    const plan = inv.planCode ? await db.query.plans.findFirst({ where: eq(plans.code, inv.planCode) }) : null;
    const admins = await db.query.users.findMany({
      where: and(eq(users.orgId, org.id), eq(users.role, "admin"), eq(users.active, true)),
      columns: { email: true, lang: true },
    });
    for (const a of admins) {
      const ar = a.lang === "ar";
      const lang = ar ? "ar" : "en";
      const day = (d: Date) => format(d, "d MMM yyyy");
      const planName = plan ? (ar && plan.nameAr) || plan.name : (inv.planCode ?? "");
      const lines = ar
        ? [
            `رقم الفاتورة: ${inv.number}`,
            `مساحة العمل: ${org.name} (${org.serial})`,
            `الباقة: ${planName}`,
            `المبلغ المدفوع: ${formatMoney(inv.amountCents, inv.currency, "ar")}`,
            inv.periodStart && inv.periodEnd ? `الفترة: ${day(inv.periodStart)} – ${day(inv.periodEnd)}` : null,
            `تاريخ الدفع: ${day(inv.createdAt)}`,
          ]
        : [
            `Invoice number: ${inv.number}`,
            `Workspace: ${org.name} (${org.serial})`,
            `Plan: ${planName}`,
            `Amount paid: ${formatMoney(inv.amountCents, inv.currency, "en")}`,
            inv.periodStart && inv.periodEnd ? `Period: ${day(inv.periodStart)} – ${day(inv.periodEnd)}` : null,
            `Paid on: ${day(inv.createdAt)}`,
          ];
      await sendEmail({
        to: a.email,
        ...notificationEmail({
          lang,
          title: ar ? `فاتورتك من أوبيرّا — ${inv.number}` : `Your Operra invoice — ${inv.number}`,
          body: lines.filter(Boolean).join("\n"),
          link: "/settings/billing",
          brand: OPERRA_BRAND,
          baseUrl: tenantBaseUrl(org),
          cta: ar ? "عرض الفوترة" : "View billing",
          footer: ar
            ? "شكراً لاشتراكك في أوبيرّا. هذه الفاتورة لاشتراك وكالتك."
            : "Thank you for subscribing to Operra. This invoice is for your agency’s subscription.",
        }),
      });
    }
    await db.update(invoices).set({ emailedAt: new Date() }).where(eq(invoices.id, inv.id));
  } catch (err) {
    console.error("[invoice email failed]", invoiceId, err);
  }
}
