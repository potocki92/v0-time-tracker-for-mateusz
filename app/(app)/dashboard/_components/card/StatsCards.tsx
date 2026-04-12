import { Card, CardContent } from '@/components/ui/card'
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

export function StatsCards({ totalHours, totalDays, clientsCount, absences }: Props) {
  const stats: Stat[] = [
    {
      icon: <Users className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />,
      value: String(clientsCount),
      label: 'Klientów',
    },
    {
      icon: <Clock className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />,
      value: `${totalHours}h`,
      label: `${totalDays} dni`,
    },
    {
      icon: <Calendar className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />,
      value: String(absences),
      label: 'Nieobecności',
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-4">
      {stats.map((s) => (
        <Card key={s.label} className="text-center">
          <CardContent className="pt-6">
            {s.icon}
            <div className="text-2xl font-bold">{s.value}</div>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
