import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { NavItem as NavItemType } from '../../types/nav.types'

interface Props {
  item: NavItemType
  isActive: boolean
}

export function NavItem({ item, isActive }: Props) {
  return (
    <Link href={item.href}>
      <Button
        variant={isActive ? 'secondary' : 'ghost'}
        size="sm"
      >
        <item.icon className="mr-2 w-4 h-4" />
        {item.label}
      </Button>
    </Link>
  )
}