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

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Matches no row: a malformed id then simply finds nothing instead of raising a database error. */
export const NO_ID = "00000000-0000-0000-0000-000000000000";

/** A record id from FormData. Anything that isn't a UUID becomes NO_ID (lookups stay scoped as usual). */
export function idOf(fd: FormData, key: string): string {
  const v = str(fd, key);
  return v && UUID.test(v) ? v : NO_ID;
}

/** An optional record id: null when blank, NO_ID when malformed, otherwise the id. */
export function optId(fd: FormData, key: string): string | null {
  return str(fd, key) === null ? null : idOf(fd, key);
}
