const footerGroups = [
  {
    title: 'Product',
    links: [
      { label: 'Tour', href: '#product' },
      { label: 'Workflow', href: '#flow' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Changelog', href: '/dashboard' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '#' },
      { label: 'Customers', href: '#customers' },
      { label: 'Careers', href: '#' },
      { label: 'Press kit', href: '#' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Docs', href: '#' },
      { label: 'API', href: '#' },
      { label: 'Status', href: '#' },
      { label: 'Security', href: '#' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '#' },
      { label: 'Terms', href: '#' },
      { label: 'DPA', href: '#' },
      { label: 'Imprint', href: '#' },
    ],
  },
]

export function FooterSection() {
  return (
    <footer
      className="relative pt-16 pb-10 border-t"
      style={{ borderColor: 'var(--hair)' }}
    >
      <div className="mx-auto max-w-[1280px] px-6 sm:px-8">
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 md:col-span-4">
            <div className="flex items-center gap-2.5 mb-3">
              <div
                className="relative h-7 w-7 shrink-0 overflow-hidden rounded-[8px] hair-strong"
                style={{ background: 'linear-gradient(135deg,#0F1A12,#000)' }}
              >
                <div className="absolute inset-0 flex items-end justify-center gap-[3px] p-1.5">
                  <span className="h-[6px] w-[3px] rounded-[1.5px] bg-[#22E07A]" />
                  <span className="h-[10px] w-[3px] rounded-[1.5px] bg-[#22E07A]" />
                  <span className="h-[14px] w-[3px] rounded-[1.5px] bg-[#22E07A]" />
                </div>
              </div>
              <span className="text-[14px] font-semibold tracking-tight">TimeTracker</span>
            </div>
            <p
              className="text-[12.5px] leading-relaxed max-w-[280px]"
              style={{ color: 'var(--ink-3)' }}
            >
              The clock for independent work. Built in Düsseldorf, used everywhere.
            </p>
          </div>

          {footerGroups.map((group) => (
            <div key={group.title} className="col-span-6 md:col-span-2">
              <div className="stat-label mb-3">{group.title}</div>
              <ul className="space-y-2 text-[12.5px]" style={{ color: 'var(--ink-2)' }}>
                {group.links.map(({ label, href }) => (
                  <li key={label}>
                    <a href={href} className="em-hover">{label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="mt-14 pt-6 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11.5px]"
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
            <a href="#" className="em-hover">EN</a>
            <a href="#" className="em-hover">DE</a>
            <a href="#" className="em-hover">PL</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
