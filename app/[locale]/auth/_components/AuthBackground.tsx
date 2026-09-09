'use client'

/**
 * Ambient backdrop for auth pages.
 *
 * The split-card is the visual focus now, so the background stays quiet:
 * a soft gradient derived from `--muted` + a barely-visible dot grid.
 * No animation — keeps attention on the card and respects reduced motion
 * for free.
 */
export function AuthBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/40 to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,var(--primary)/15%,transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,var(--chart-2)/15%,transparent_55%)]" />

      <div
        className="absolute inset-0 opacity-[0.035] dark:opacity-[0.06]"
        style={{
          backgroundImage:
            'radial-gradient(currentColor 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          color: 'var(--foreground)',
        }}
      />
    </div>
  )
}
