import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Target } from 'lucide-react'
import { formatCurrency } from '@/lib/helpers'

type Props = {
  progress: number
  target: number
  currency: 'PLN' | 'EUR'
  variant?: 'bar' | 'radial'
}

/**
 * Radial progress — SVG z stroke-dasharray, 72×72, bez zewnętrznej zależności.
 * Wybór wariantu steruje z DashboardContent (Bento col-span decyduje o gęstości).
 */
function RadialProgress({ value }: { value: number }) {
  const size = 88
  const stroke = 8
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - value / 100)
  const reached = value >= 100

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`Postęp celu: ${value.toFixed(0)} procent`}
      className="shrink-0 -rotate-90"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="var(--muted)"
        strokeWidth={stroke}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={reached ? 'var(--success)' : 'var(--primary)'}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        fill="none"
        style={{ transition: 'stroke-dashoffset 450ms ease' }}
      />
    </svg>
  )
}

export function GoalCard({ progress, target, currency, variant = 'bar' }: Props) {
  const clamped = Math.min(100, Math.max(0, progress))
  const reached = clamped >= 100

  if (variant === 'radial') {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Target className="h-4 w-4 text-[var(--primary-accessible)]" aria-hidden />
            Cel miesięczny
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <div className="relative flex items-center justify-center">
            <RadialProgress value={clamped} />
            <span
              className={`absolute text-lg font-bold tabular-nums ${reached ? 'text-[var(--success-foreground)]' : ''}`}
            >
              {clamped.toFixed(0)}%
            </span>
          </div>
          <div className="min-w-0 space-y-0.5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Cel</p>
            <p className="truncate text-sm font-semibold tabular-nums">
              {formatCurrency(target, currency)}
            </p>
            {reached && (
              <p className="text-xs text-[var(--success-foreground)]">Cel osiągnięty!</p>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Target className="h-4 w-4 text-[var(--primary-accessible)]" aria-hidden />
          Cel miesięczny
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress
          value={clamped}
          className="h-2"
          aria-label={`Postęp celu: ${clamped.toFixed(0)} procent`}
        />
        <div className="flex justify-between text-sm">
          <span className={reached ? 'font-semibold text-[var(--success-foreground)]' : ''}>
            {clamped.toFixed(0)}%
          </span>
          <span className="font-medium">
            {formatCurrency(target, currency)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
