import Link from 'next/link'

interface FooterLink {
  href: string
  label: string
  external?: boolean
}

interface FooterLinkGroupProps {
  title: string
  links: readonly FooterLink[]
}

export function FooterLinkGroup({ title, links }: FooterLinkGroupProps) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => {
          const className = 'text-sm text-foreground/80 transition-colors hover:text-foreground'
          return (
            <li key={link.href}>
              {link.external ? (
                <a href={link.href} className={className}>
                  {link.label}
                </a>
              ) : (
                <Link href={link.href} className={className}>
                  {link.label}
                </Link>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
