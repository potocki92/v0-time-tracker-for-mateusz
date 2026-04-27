import { TimeRange } from './dashboard.types'

export const DEFAULT_EUR_TO_PLN = 4.3

export const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: 'current_week', label: 'Obecny tydzień' },
  { value: 'previous_week', label: 'Poprzedni tydzień' },
  { value: 'current_month', label: 'Obecny miesiąc' },
  { value: 'previous_month', label: 'Poprzedni miesiąc' },
  { value: 'current_quarter', label: 'Obecny kwartał' },
  { value: 'current_year', label: 'Obecny rok' },
  { value: 'all', label: 'Wszystko' },
]