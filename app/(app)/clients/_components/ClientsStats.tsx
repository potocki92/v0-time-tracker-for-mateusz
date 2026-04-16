'use client'

import { Briefcase, Coins, History, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { ClientWithStats } from '../_domain/clients.types'

type Props = {
  clients: ClientWithStats[]
}

export function ClientsStats({ clients }: Props) {
  const total       = clients.length
  const withDefault = clients.some((c) => c.is_default)
  const hourly      = clients.filter((c) => c.work_type === 'hourly').length
  const piecework   = total - hourly
  const withHistory = clients.filter((c) => c.rateHistoryCount > 1).length

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard
        icon={<Users className="h-4 w-4" />}
        label="Klientów"
        value={String(total)}
        hint={withDefault ? '1 domyślny' : 'Brak domyślnego'}
      />
      <StatCard
        icon={<Briefcase className="h-4 w-4" />}
        label="Godzinowa"
        value={String(hourly)}
        hint={`Akord: ${piecework}`}
      />
      <StatCard
        icon={<Coins className="h-4 w-4" />}
        label="Waluty"
        value={`${clients.filter((c) => c.currency === 'PLN').length} PLN`}
        hint={`${clients.filter((c) => c.currency === 'EUR').length} EUR`}
      />
      <StatCard
        icon={<History className="h-4 w-4" />}
        label="Zmieniali stawkę"
        value={String(withHistory)}
        hint={withHistory ? 'Dostępna historia' : 'Tylko aktualna'}
      />
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode
  label: string
  value: string
  hint?: string
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 p-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
        </div>
        <div className="text-xl font-bold tracking-tight">{value}</div>
        {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  )
}
