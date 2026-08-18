const logos = [
  { key: 'jh', height: 34, children: (
    <svg viewBox="0 0 160 34" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="17" cy="17" r="15" stroke="currentColor" strokeWidth="1.2" />
      <text x="17" y="22" textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="13" fontWeight="700" fill="currentColor" letterSpacing="-0.5">JH</text>
      <text x="42" y="22" fontFamily="Inter,sans-serif" fontSize="15" fontWeight="600" fill="currentColor" letterSpacing="-0.3">Smart Solutions</text>
    </svg>
  )},
  { key: 'gawlik', height: 34, children: (
    <svg viewBox="0 0 170 34" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text x="0" y="23" fontFamily="Inter,sans-serif" fontSize="21" fontWeight="300" fontStyle="italic" fill="currentColor" letterSpacing="-0.8">Gawlik</text>
      <line x1="77" y1="6" x2="77" y2="28" stroke="currentColor" strokeWidth="0.8" />
      <text x="86" y="23" fontFamily="Inter,sans-serif" fontSize="13" fontWeight="500" fill="currentColor" letterSpacing="2">{'& CO'}</text>
    </svg>
  )},
  { key: 'ignor', height: 32, children: (
    <svg viewBox="0 0 170 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="4" width="170" height="24" stroke="currentColor" strokeWidth="1" rx="2" />
      <text x="10" y="22" fontFamily="Inter,sans-serif" fontSize="14" fontWeight="700" fill="currentColor" letterSpacing="2">IGNOR</text>
      <line x1="82" y1="6" x2="82" y2="26" stroke="currentColor" strokeWidth="0.6" />
      <text x="90" y="22" fontFamily="Inter,sans-serif" fontSize="14" fontWeight="300" fill="currentColor" letterSpacing="4">BAU</text>
    </svg>
  )},
  { key: 'auto', height: 30, children: (
    <svg viewBox="0 0 150 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text x="0" y="22" fontFamily="Geist Mono,monospace" fontSize="18" fontWeight="400" fill="currentColor">auto</text>
      <circle cx="56" cy="15" r="2.5" fill="currentColor" />
      <text x="62" y="22" fontFamily="Geist Mono,monospace" fontSize="18" fontWeight="500" fill="currentColor">werk</text>
    </svg>
  )},
  { key: 'nordlicht', height: 34, children: (
    <svg viewBox="0 0 200 34" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 22 L10 8 L16 22 L22 8 L28 22" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <text x="38" y="22" fontFamily="Inter,sans-serif" fontSize="18" fontWeight="600" fill="currentColor" letterSpacing="-0.5">Nordlicht</text>
      <text x="130" y="22" fontFamily="Inter,sans-serif" fontSize="14" fontWeight="300" fill="currentColor" letterSpacing="2">STUDIO</text>
    </svg>
  )},
  { key: 'kleinstein', height: 30, children: (
    <svg viewBox="0 0 180 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="4" width="6" height="22" fill="currentColor" />
      <text x="14" y="21" fontFamily="Inter,sans-serif" fontSize="16" fontWeight="300" fill="currentColor" letterSpacing="5">KLEINSTEIN</text>
    </svg>
  )},
  { key: 'atelier', height: 34, children: (
    <svg viewBox="0 0 160 34" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text x="0" y="24" fontFamily="Inter,sans-serif" fontSize="22" fontWeight="700" fill="currentColor" letterSpacing="-0.8">Atelier</text>
      <text x="82" y="24" fontFamily="Geist Mono,monospace" fontSize="20" fontWeight="500" fill="currentColor">44</text>
      <circle cx="120" cy="10" r="3" stroke="currentColor" strokeWidth="1.2" fill="none" />
    </svg>
  )},
  { key: 'kontur', height: 34, children: (
    <svg viewBox="0 0 170 34" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 28 L4 6 L22 6 L22 18 L40 18 L40 6 L58 6 L58 28" stroke="currentColor" strokeWidth="1.4" fill="none" />
      <text x="70" y="22" fontFamily="Inter,sans-serif" fontSize="15" fontWeight="500" fill="currentColor" letterSpacing="1">KONTUR BAU</text>
    </svg>
  )},
]

export function StatsStripSection() {
  return (
    <section className="relative pt-6 pb-16">
      <div className="mx-auto max-w-[1280px] px-6 sm:px-8">
        <div className="eyebrow text-center mb-9">Trusted by independents · agencies · craftsmen</div>
        <div className="fade-edges overflow-hidden">
          <div className="marquee items-center">
            {[...logos, ...logos].map(({ key, height, children }, i) => (
              <span key={`${key}-${i}`} className="logo-cell" style={{ height }}>
                {children}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
