import { Card, CardContent } from '@/components/ui/card'
import { Clock } from 'lucide-react'

export function EmptyState() {
  return (
    <Card className="py-12 text-center">
      <CardContent>
        <Clock className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
        <h3 className="text-lg font-medium">
          Zacznij śledzić czas pracy
        </h3>
      </CardContent>
    </Card>
  )
}