"use server";

import { z } from "zod";
import { deliverInquiry, deliveryConfigured } from "@/lib/deliver";
import { TRIAL_ROLES } from "@/content/roles";

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
const required = (label: string, max = 200) =>
  z.string(`${label} is required.`).trim().min(1, `${label} is required.`).max(max);

const base = {
  name: required("Your name", 120),
  email: z.email("Enter a valid email address.").max(200),
};

const TrialSchema = z.object({
  ...base,
  agency: required("Agency name", 160),
  // Optional select: untouched it submits "".
  role: z.union([z.literal(""), z.enum(TRIAL_ROLES, "Choose your role.")]).default(""),
  teamSize: z.enum(["1-5", "6-15", "16-50", "51+"], "Choose your team size."),
  agencyType: text(80),
  language: z.enum(["English", "Arabic", "Both"], "Choose a language."),
  website: text(200),
  message: text(2000),
});

const ContactSchema = z.object({
  ...base,
  agency: text(160),
  topic: z.enum(["Sales", "Demo", "Existing workspace", "Other"], "Choose a topic."),
  message: required("Message", 4000),
});

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
  const failed = { error: "We couldn’t send this right now. Please try again in a moment.", values: submitted };
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
  const parsed = TrialSchema.safeParse(v);
  if (!parsed.success) return { error: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error), values: v };
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
    },
    d.email,
    v,
  );
}

export async function submitContact(_prev: FormState, fd: FormData): Promise<FormState> {
  const v = values(fd);
  if (looksAutomated(v)) return { ok: true };
  const parsed = ContactSchema.safeParse(v);
  if (!parsed.success) return { error: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error), values: v };
  const d = parsed.data;
  return send("contact", { Name: d.name, Email: d.email, Agency: d.agency, Topic: d.topic, Message: d.message }, d.email, v);
}
