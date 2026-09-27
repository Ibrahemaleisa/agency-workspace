"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { submitTransfer } from "@/server/billing-actions";
import { ActionForm, SubmitButton } from "./forms";
import { FILE_INPUT } from "./ui";

type Labels = {
  period: string;
  months: string[];
  total: string;
  step1: string;
  bank: string;
  accountName: string;
  iban: string;
  reference: string;
  referenceHint: string;
  copy: string;
  copied: string;
  step2: string;
  receipt: string;
  submit: string;
  after: string;
};

function CopyValue({ value, labels, mono }: { value: string; labels: { copy: string; copied: string }; mono?: boolean }) {
  const [done, setDone] = useState(false);
  return (
    <span className="flex items-center justify-between gap-3">
      <span className={mono ? "font-mono tracking-wide break-all" : "font-medium"} dir="ltr">
        {value}
      </span>
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(value.replace(/\s+/g, mono ? "" : " "));
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        }}
        className="inline-flex shrink-0 items-center gap-1 rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-50"
      >
        {done ? <Check aria-hidden className="size-3.5" /> : <Copy aria-hidden className="size-3.5" />}
        {done ? labels.copied : labels.copy}
      </button>
    </span>
  );
}

/** Bank transfer: choose how many months, see the exact amount and account, upload the receipt. */
export function PayForm({
  planCode,
  monthlyCents,
  currency,
  lang,
  bank,
  reference,
  labels,
}: {
  planCode: string;
  monthlyCents: number;
  currency: string;
  lang: string;
  bank: { bankName: string; accountName: string; iban: string; instructions: string };
  reference: string;
  labels: Labels;
}) {
  const options = [1, 3, 6, 12];
  const [months, setMonths] = useState(1);
  const money = (cents: number) =>
    new Intl.NumberFormat(lang === "ar" ? "ar-SA" : "en", { style: "currency", currency, maximumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);
  const row = "border-b border-zinc-100 py-3 last:border-0";

  return (
    <ActionForm action={submitTransfer} className="space-y-6">
      <input type="hidden" name="plan" value={planCode} />
      <fieldset>
        <legend className="mb-2 text-sm font-medium">{labels.period}</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {options.map((m, i) => (
            <label
              key={m}
              className="flex cursor-pointer flex-col rounded-lg border border-zinc-300 bg-white p-3 text-sm has-checked:border-zinc-900 has-checked:ring-1 has-checked:ring-zinc-900"
            >
              <span className="flex items-center gap-2">
                <input type="radio" name="months" value={m} checked={months === m} onChange={() => setMonths(m)} />
                <span className="font-medium">{labels.months[i]}</span>
              </span>
              <span className="mt-1 ps-5 text-zinc-500 tabular-nums">{money(monthlyCents * m)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex items-baseline justify-between rounded-xl bg-zinc-900 px-5 py-4 text-white">
        <span className="text-sm text-zinc-300">{labels.total}</span>
        <span className="text-2xl font-semibold tabular-nums" data-testid="pay-total">
          {money(monthlyCents * months)}
        </span>
      </div>

      <section>
        <h2 className="font-semibold">{labels.step1}</h2>
        <dl className="mt-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm">
          {bank.bankName && (
            <div className={row}>
              <dt className="text-xs text-zinc-500">{labels.bank}</dt>
              <dd className="mt-1 font-medium">{bank.bankName}</dd>
            </div>
          )}
          <div className={row}>
            <dt className="text-xs text-zinc-500">{labels.accountName}</dt>
            <dd className="mt-1">
              <CopyValue value={bank.accountName} labels={labels} />
            </dd>
          </div>
          <div className={row}>
            <dt className="text-xs text-zinc-500">{labels.iban}</dt>
            <dd className="mt-1">
              <CopyValue value={bank.iban} labels={labels} mono />
            </dd>
          </div>
          <div className={row}>
            <dt className="text-xs text-zinc-500">{labels.reference}</dt>
            <dd className="mt-1">
              <CopyValue value={reference} labels={labels} mono />
              <p className="mt-1 text-xs text-zinc-500">{labels.referenceHint}</p>
            </dd>
          </div>
        </dl>
        {bank.instructions && <p className="mt-2 text-sm whitespace-pre-line text-zinc-600">{bank.instructions}</p>}
      </section>

      <section>
        <h2 className="font-semibold">{labels.step2}</h2>
        <label className="mt-2 block text-sm">
          <span className="mb-1 block text-zinc-600">{labels.receipt}</span>
          <input type="file" name="receipt" required accept="image/png,image/jpeg,image/webp,application/pdf" className={FILE_INPUT} />
        </label>
      </section>

      <SubmitButton className="w-full" data-testid="pay-submit">
        {labels.submit}
      </SubmitButton>
      <p className="text-sm text-zinc-500">{labels.after}</p>
    </ActionForm>
  );
}
