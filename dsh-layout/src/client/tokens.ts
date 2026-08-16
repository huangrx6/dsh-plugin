/**
 * Design tokens — the single source of truth for the layout plugin's visual
 * language. Every radius, spacing, and surface color used by styles.ts (and
 * the JS passes) resolves through these custom properties, so a value change
 * here is the one place a retheme touches.
 *
 * --dsh-layout-glass-base is the theme-adaptive tint every auto-colored
 * frosted area mixes from; light surfaces stay pure neutral while dark
 * mirrors surface's chrome base so panels sit consistently on the material.
 */
export const TOKENS_CSS = `:root {
  --dsh-layout-radius: 4px;
  --dsh-layout-radius-lg: 4px;
  --dsh-layout-inner-inset: 8px;
  --dsh-layout-solid: light-dark(rgb(255 255 255), rgb(25 27 32));
  --dsh-layout-glass-base: light-dark(rgb(255 255 255), rgb(25 27 32));
  --dsh-layout-subtle: light-dark(rgb(244 247 251), rgb(34 37 44));
  --dsh-layout-line: light-dark(rgb(222 227 235), rgb(61 65 75));
}`
