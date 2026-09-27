/** WCAG relative luminance of a #rrggbb colour (null if it isn't one). */
function luminance(hex: string): number | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(m[1].slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Highest surface luminance that keeps zinc-400 text (#9f9fa9) at 4.5:1 or more, with margin for translucent white overlays. */
const MAX_SURFACE_LUMINANCE = 0.02;

/**
 * The brand's dark surface colour: the primary itself when it's dark enough, otherwise the primary
 * mixed with black in OKLab (which scales lightness ~ luminance^⅓) down to MAX_SURFACE_LUMINANCE.
 */
export function inkFor(primary: string) {
  const y = luminance(primary);
  if (y === null || y <= MAX_SURFACE_LUMINANCE) return primary;
  const keep = Math.floor(Math.cbrt(MAX_SURFACE_LUMINANCE / y) * 100);
  return `color-mix(in oklab, ${primary} ${keep}%, black)`;
}

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
  // Dark surfaces (sidebar, primary buttons) carry light text, so they must stay dark whatever the
  // agency picks: a lighter primary is deepened (same hue) until light-grey text passes WCAG AA.
  const vars: Record<string, string> = { "--color-ink": inkFor(P), "--brand-primary": P, "--brand-accent": A };
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
