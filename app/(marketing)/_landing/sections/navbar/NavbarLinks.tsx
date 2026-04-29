import { LANDING_NAV_LINKS } from '@/app/(marketing)/_landing/logic/navigation'

interface NavbarLinksProps {
  mobile?: boolean
  onNavigate?: () => void
}

export function NavbarLinks({ mobile = false, onNavigate }: NavbarLinksProps) {
  return (
    <>
      {LANDING_NAV_LINKS.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className={
            mobile
              ? 'rounded-md px-3 py-2 text-sm font-medium text-foreground/90 hover:bg-accent'
              : 'text-sm font-medium text-muted-foreground transition-colors hover:text-foreground'
          }
          onClick={onNavigate}
        >
          {link.label}
        </a>
      ))}
    </>
  )
}
