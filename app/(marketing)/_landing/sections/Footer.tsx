import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-[var(--lp-hair)]">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:px-8">
        <div className="flex items-center gap-2">
          <span aria-hidden className="size-4 rounded-[5px] bg-[var(--lp-accent)]" />
          <span className="lp-t13 font-semibold tracking-tight">TimeTracker</span>
        </div>

        <p className="max-w-[42ch] lp-t13 text-[var(--lp-ink-2)]">
          The clock, the calendar and the invoice in one place.
        </p>

        <nav aria-label="Stopka" className="flex flex-wrap gap-5 sm:ml-auto">
          <Link href="/auth/login" className="lp-t13 text-[var(--lp-ink-2)] hover:text-[var(--lp-ink-1)]">
            Sign in
          </Link>
          <Link href="/dashboard" className="lp-t13 text-[var(--lp-ink-2)] hover:text-[var(--lp-ink-1)]">
            Open app
          </Link>
          <a
            href="https://github.com/potocki92/v0-time-tracker-for-mateusz"
            className="lp-t13 text-[var(--lp-ink-2)] hover:text-[var(--lp-ink-1)]"
          >
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  )
}
