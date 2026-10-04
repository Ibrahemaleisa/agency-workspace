export type ActionState = { error?: string; ok?: boolean } | undefined;

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

/**
 * A same-site path that is safe to redirect to, or null.
 * Rejects "//host" and "/\host" (browsers treat a backslash like a slash), and control characters.
 */
export function safePath(v: string | null | undefined): string | null {
  if (!v || !v.startsWith("/") || v.startsWith("//") || /[\\\u0000-\u001f]/.test(v)) return null;
  return v;
}
