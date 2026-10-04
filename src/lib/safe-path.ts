/**
 * A same-site path to redirect to, or null. Rejects absolute URLs and protocol-relative
 * forms — browsers treat both "//host" and "/\host" as another site.
 */
export function safePath(value: string | null | undefined): string | null {
  return value && /^\/(?![/\\])/.test(value) ? value : null;
}
