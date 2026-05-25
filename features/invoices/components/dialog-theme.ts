/**
 * Forces the always-dark Dashboard palette inside invoice modals, regardless
 * of the app's active light/dark/system theme or the selected color theme
 * (emerald/blue/…). The list & detail panels already hard-code this same
 * #0a0a0a / #1a1a1a / emerald palette, so the modals must match.
 *
 * Mechanism: add the `dark` class so primitives' `dark:` variants and the
 * `.dark` foreground tokens apply, then pin the surface/accent CSS variables
 * to neutral hex values so color-theme tints can't bleed in. Apply to each
 * `DialogContent` AND to portalled panels (SelectContent / PopoverContent /
 * Command) because those render outside the dialog's DOM subtree.
 */
export const DIALOG_DARK_SURFACE =
  'dark [color-scheme:dark] ' +
  '[--background:#0a0a0a] [--foreground:#fafafa] ' +
  '[--card:#0a0a0a] [--card-foreground:#fafafa] ' +
  '[--popover:#0a0a0a] [--popover-foreground:#fafafa] ' +
  '[--muted:#161616] [--muted-foreground:#a1a1aa] ' +
  '[--accent:#1a1a1a] [--accent-foreground:#fafafa] ' +
  '[--border:#1a1a1a] [--input:#1a1a1a] ' +
  '[--ring:#10b981] [--primary:#10b981] [--primary-foreground:#000000]'
