import { BrandMark } from '../../components/BrandMark'
import { FOOTER_GROUPS } from './data'

export function FooterSection() {
  return (
    <footer className="relative border-t pb-10 pt-16" style={{ borderColor: 'var(--hair)' }}>
      <div className="mx-auto max-w-[1280px] px-6 sm:px-8">
        <div className="grid grid-cols-12 gap-8">
          <div className="reveal-row col-span-12 md:col-span-4">
            <div className="mb-3">
              <BrandMark />
            </div>
            <p
              className="max-w-[280px] text-[12.5px] leading-relaxed"
              style={{ color: 'var(--ink-3)' }}
            >
              The clock for independent work. Built in Düsseldorf, used everywhere.
            </p>
          </div>

          {FOOTER_GROUPS.map((group, i) => (
            <div
              key={group.title}
              className="reveal-row col-span-6 md:col-span-2"
              style={{ transitionDelay: `${(i + 1) * 60}ms` }}
            >
              <div className="stat-label mb-3">{group.title}</div>
              <ul className="space-y-2 text-[12.5px]" style={{ color: 'var(--ink-2)' }}>
                {group.links.map(({ label, href }) => (
                  <li key={label}>
                    <a href={href} className="em-hover">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="mt-14 flex flex-col items-start justify-between gap-3 border-t pt-6 text-[11.5px] sm:flex-row sm:items-center"
          style={{ borderColor: 'var(--hair)', color: 'var(--ink-3)' }}
        >
          <div>© 2026 TimeTracker GmbH · All rights reserved.</div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span
                className="live-dot"
                style={{ width: 6, height: 6, background: '#22E07A', borderRadius: '50%' }}
              />
              All systems operational
            </span>
            <a href="#" className="em-hover">
              EN
            </a>
            <a href="#" className="em-hover">
              DE
            </a>
            <a href="#" className="em-hover">
              PL
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
