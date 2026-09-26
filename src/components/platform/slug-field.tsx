"use client";

import { useState } from "react";
import { inputClass } from "../ui";

const clean = (v: string) =>
  v
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .slice(0, 40);

/** Company name + address, with the address following the name until it's edited by hand. */
export function CompanySlugFields({
  labels,
  template,
  defaults,
}: {
  labels: { name: string; slug: string; slugHint: string };
  template: string;
  defaults: { name: string; slug: string };
}) {
  const [name, setName] = useState(defaults.name);
  const [slug, setSlug] = useState(defaults.slug);
  const [touched, setTouched] = useState(!!defaults.slug);
  const shown = slug || "your-agency";
  return (
    <>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">{labels.name}</span>
        <input
          name="companyName"
          required
          autoFocus
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!touched) setSlug(clean(e.target.value).replace(/-+$/, ""));
          }}
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">{labels.slug}</span>
        <input
          name="slug"
          required
          dir="ltr"
          value={slug}
          pattern="[a-z0-9][a-z0-9-]{1,38}[a-z0-9]"
          aria-describedby="slug-hint"
          onChange={(e) => {
            setTouched(true);
            setSlug(clean(e.target.value));
          }}
          className={`${inputClass} font-mono`}
        />
        <span id="slug-hint" className="mt-1 block text-xs text-zinc-500">
          {labels.slugHint}{" "}
          <span dir="ltr" className="font-mono text-zinc-800">
            {template.replace("{slug}", shown)}
          </span>
        </span>
      </label>
    </>
  );
}
