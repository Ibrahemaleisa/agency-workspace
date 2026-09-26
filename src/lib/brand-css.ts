/**
 * The palette derived from an agency's two brand colours. Shared by the server (page theme)
 * and the browser (live preview during sign-up), so it has no server-only imports.
 * `accent` is the light highlight colour, `primary` the dark one (sidebar, buttons, landing page).
 */
export function brandVars(b: { primary: string; accent: string }): Record<string, string> {
  const A = b.accent;
  const P = b.primary;
  const mixW = (c: string, pct: number) => `color-mix(in oklab, ${c} ${pct}%, white)`;
  const mixB = (c: string, pct: number) => `color-mix(in oklab, ${c} ${pct}%, black)`;
  const sand: Record<number, string> = {
    50: mixW(A, 22), 100: mixW(A, 50), 200: A, 300: mixB(A, 92), 400: mixB(A, 82), 500: mixB(A, 70),
    600: mixB(A, 57), 700: mixB(A, 44), 800: mixB(A, 31), 900: mixB(A, 19), 950: mixB(A, 11),
  };
  const indigo: Record<number, string> = {
    50: mixW(A, 25), 100: mixW(A, 45), 200: mixW(A, 70), 300: mixB(A, 94),
    400: `color-mix(in oklab, ${A} 45%, ${P})`, 500: mixW(P, 78), 600: P, 700: mixB(P, 85),
    800: mixB(P, 72), 900: mixB(P, 60), 950: mixB(P, 45),
  };
  const vars: Record<string, string> = { "--color-ink": P, "--brand-primary": P, "--brand-accent": A };
  for (const [k, v] of Object.entries(sand)) {
    vars[`--color-sand-${k}`] = v;
    vars[`--color-violet-${k}`] = v;
  }
  for (const [k, v] of Object.entries(indigo)) vars[`--color-indigo-${k}`] = v;
  return vars;
}

/**
 * CSS that re-tints the whole interface from two brand colors.
 * Tailwind utilities read these variables, so every bg-ink / text-sand-200 / indigo-600 follows the brand.
 */
export function brandCss(b: { primary: string; accent: string }) {
  const body = Object.entries(brandVars(b))
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
  // `html:root` outranks Tailwind's own `:root` theme block regardless of stylesheet order.
  return `html:root{${body}}`;
}
