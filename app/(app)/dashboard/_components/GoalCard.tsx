import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Target } from 'lucide-react'
import { formatCurrency } from '@/lib/helpers'

type Props = {
  progress: number
  target: number
  currency: 'PLN' | 'EUR'
}

export function GoalCard({ progress, target, currency }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Target className="h-4 w-4 text-primary" />
          Cel miesięczny
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        <Progress value={progress} className="h-2" />

        <div className="flex justify-between text-sm">
          <span>{progress.toFixed(0)}%</span>
          <span className="font-medium">
            {formatCurrency(target, currency)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}