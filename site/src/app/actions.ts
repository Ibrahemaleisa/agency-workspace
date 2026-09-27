"use server";

import { z } from "zod";
import { deliverInquiry, deliveryConfigured } from "@/lib/deliver";
import { CONTENT } from "@/content";
import type { Ui } from "@/content/en/ui";
import { isLocale } from "@/i18n/config";

export type FormState =
  | {
      ok?: boolean;
      error?: string;
      fieldErrors?: Record<string, string>;
      /** Submitted values, echoed back on error so the form keeps what was typed. */
      values?: Record<string, string>;
    }
  | undefined;

/** Optional text: absent fields (e.g. an untouched select) become "". */
const text = (max: number) => z.string().trim().max(max).default("");

/** Stored values are the English option values in both languages. */
const optionValues = (list: { value: string }[]) => list.map((o) => o.value) as [string, ...string[]];

function schemas(ui: Ui) {
  const f = ui.form;
  const required = (label: string, max = 200) => {
    const msg = f.required.replace("{label}", label);
    return z.string(msg).trim().min(1, msg).max(max);
  };
  const base = { name: required(f.name, 120), email: z.email(f.invalidEmail).max(200) };
  return {
    trial: z.object({
      ...base,
      agency: required(f.agencyName, 160),
      // Optional select: untouched it submits "".
      role: z.union([z.literal(""), z.enum(optionValues(ui.options.roles), f.chooseRole)]).default(""),
      teamSize: z.enum(optionValues(ui.options.teamSize), f.chooseTeamSize),
      agencyType: text(80),
      language: z.enum(optionValues(ui.options.language), f.chooseLanguage),
      website: text(200),
      message: text(2000),
    }),
    contact: z.object({
      ...base,
      agency: text(160),
      topic: z.enum(optionValues(ui.options.topic), f.chooseTopic),
      message: required(f.message, 4000),
    }),
  };
}

/** The form's language (a hidden field — root params aren't available in actions). */
const uiFor = (v: Record<string, string>) => CONTENT[isLocale(v.locale) ? v.locale : "en"].UI;

function values(fd: FormData) {
  const out: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string") out[k] = v;
  return out;
}

/** Honeypot filled in, or submitted faster than a person could: treat as a bot. */
function looksAutomated(v: Record<string, string>) {
  const started = Number(v.startedAt);
  return !!v.company_url || (Number.isFinite(started) && Date.now() - started < 1500);
}

function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0]);
    out[key] ??= issue.message;
  }
  return out;
}

async function send(
  kind: "trial" | "contact",
  fields: Record<string, string>,
  replyTo: string,
  submitted: Record<string, string>,
): Promise<FormState> {
  const failed = { error: uiFor(submitted).form.sendFailed, values: submitted };
  if (process.env.NODE_ENV === "production" && !deliveryConfigured()) {
    console.error("[inquiry] no delivery channel configured");
    return failed;
  }
  try {
    await deliverInquiry({ kind, fields }, replyTo);
    return { ok: true };
  } catch (e) {
    console.error("[inquiry]", e);
    return failed;
  }
}

export async function submitTrial(_prev: FormState, fd: FormData): Promise<FormState> {
  const v = values(fd);
  if (looksAutomated(v)) return { ok: true };
  const ui = uiFor(v);
  const parsed = schemas(ui).trial.safeParse(v);
  if (!parsed.success) return { error: ui.form.checkFields, fieldErrors: fieldErrors(parsed.error), values: v };
  const d = parsed.data;
  return send(
    "trial",
    {
      Name: d.name,
      Email: d.email,
      Agency: d.agency,
      Role: d.role,
      "Team size": d.teamSize,
      "Agency type": d.agencyType,
      "Workspace language": d.language,
      Website: d.website,
      Notes: d.message,
      "Site language": v.locale === "ar" ? "Arabic" : "English",
    },
    d.email,
    v,
  );
}

export async function submitContact(_prev: FormState, fd: FormData): Promise<FormState> {
  const v = values(fd);
  if (looksAutomated(v)) return { ok: true };
  const ui = uiFor(v);
  const parsed = schemas(ui).contact.safeParse(v);
  if (!parsed.success) return { error: ui.form.checkFields, fieldErrors: fieldErrors(parsed.error), values: v };
  const d = parsed.data;
  return send(
    "contact",
    { Name: d.name, Email: d.email, Agency: d.agency, Topic: d.topic, Message: d.message, "Site language": v.locale === "ar" ? "Arabic" : "English" },
    d.email,
    v,
  );
}
