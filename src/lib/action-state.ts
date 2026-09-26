export type ActionState =
  | {
      error?: string;
      ok?: boolean;
      /** A link to show (and copy) after success, e.g. an invitation link. */
      link?: string;
    }
  | undefined;

/** Read a trimmed string from FormData; empty strings become null. */
export function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

export function bool(fd: FormData, key: string): boolean {
  const v = fd.get(key);
  return v === "on" || v === "true" || v === "1";
}
