import { Card, CardContent } from '@/components/ui/card'
import { Clock, Calendar, Users } from 'lucide-react'

type Props = {
  totalHours: number
  totalDays: number
  clientsCount: number
  absences: number
}

export function StatsCards({ totalHours, totalDays, clientsCount, absences }: Props) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <Card className="text-center">
        <CardContent className="pt-6">
          <Users className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
          <div className="text-2xl font-bold">{clientsCount}</div>
          <p className="text-xs text-muted-foreground">Klientów</p>
        </CardContent>
      </Card>

      <Card className="text-center">
        <CardContent className="pt-6">
          <Clock className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
          <div className="text-2xl font-bold">{totalHours}h</div>
          <p className="text-xs text-muted-foreground">{totalDays} dni</p>
        </CardContent>
      </Card>

      <Card className="text-center">
        <CardContent className="pt-6">
          <Calendar className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
          <div className="text-2xl font-bold">{absences}</div>
          <p className="text-xs text-muted-foreground">Nieobecności</p>
        </CardContent>
      </Card>
    </div>
  )
}