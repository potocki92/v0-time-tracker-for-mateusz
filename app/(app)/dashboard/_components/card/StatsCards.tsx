import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, Calendar, Users } from 'lucide-react'

type Stat = {
  icon: React.ReactNode
  value: string
  label: string
  sublabel?: string
}

type Props = {
  totalHours: number
  totalDays: number
  clientsCount: number
  absences: number
}

/**
 * Kompaktowe wiersze zamiast równych kafli 3×1.
 * Rationale: w Bento stats siedzą w 4/12 kolumnie — 3 kafle obok siebie
 * zostałyby ściśnięte do ~11% szerokości ekranu. Układ wierszowy czyta się
 * dobrze zarówno w wąskiej kolumnie, jak i na mobile (single-col).
 */
export function StatsCards({ totalHours, totalDays, clientsCount, absences }: Props) {
  const stats: Stat[] = [
    {
      icon: <Users className="h-4 w-4 text-muted-foreground" aria-hidden />,
      value: String(clientsCount),
      label: 'Klientów',
    },
    {
      icon: <Clock className="h-4 w-4 text-muted-foreground" aria-hidden />,
      value: `${totalHours}h`,
      label: 'Godzin pracy',
      sublabel: `${totalDays} dni`,
    },
    {
      icon: <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden />,
      value: String(absences),
      label: 'Nieobecności',
    },
  ]

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Aktywność</CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <ul role="list" className="divide-y divide-border/50">
          {stats.map((s) => (
            <li
              key={s.label}
              className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/60">
                  {s.icon}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm">{s.label}</p>
                  {s.sublabel && (
                    <p className="text-[11px] text-muted-foreground">{s.sublabel}</p>
                  )}
                </div>
              </div>
              <span className="shrink-0 text-lg font-semibold tabular-nums">{s.value}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
