'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowUpRight,
  Banknote,
  Calendar,
  Clock,
  Euro,
  FileText,
  Settings,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react'
import { Area, Bar, CartesianGrid, ComposedChart, XAxis, YAxis } from 'recharts'

import { createClient } from '@/lib/supabase/client'
import { calculateEarnings, calculateMonthlyTotals, formatCurrency } from '@/lib/helpers'
import type { Client, Invoice, WorkEntry } from '@/lib/types'
import { MONTH_NAMES } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

type TimeRange =
  | 'current_week'
  | 'previous_week'
  | 'current_month'
  | 'previous_month'
  | 'current_quarter'
  | 'current_year'
  | 'all'
type ChartGrouping = 'daily' | 'weekly' | 'monthly'

const DEFAULT_EUR_TO_PLN = 4.3

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: 'current_week', label: 'Obecny tydzień' },
  { value: 'previous_week', label: 'Poprzedni tydzień' },
  { value: 'current_month', label: 'Obecny miesiąc' },
  { value: 'previous_month', label: 'Poprzedni miesiąc' },
  { value: 'current_quarter', label: 'Obecny kwartał' },
  { value: 'current_year', label: 'Obecny rok' },
  { value: 'all', label: 'Wszystko' },
]

const chartConfig = {
  earningsPLN: { label: 'Zarobki (PLN)', color: 'hsl(var(--primary))' },
  hours: { label: 'Godziny', color: 'hsl(var(--chart-2))' },
} as const

function getWeekStart(date: Date): Date {
  const clone = new Date(date)
  const day = clone.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  clone.setDate(clone.getDate() + mondayOffset)
  clone.setHours(0, 0, 0, 0)
  return clone
}

function formatCompactNumber(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`
  }
  return `${value}`
}

function getWeekLabel(date: Date): string {
  const weekStart = getWeekStart(date)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  return `${weekStart.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })}–${weekEnd.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })}`
}

function DashboardLoadingSkeleton() {
  return (
    <div className="container space-y-6 px-4 py-6">
      <div className="sticky top-0 z-20 -mx-4 space-y-3 border-b bg-background/95 px-4 pb-4 pt-2 backdrop-blur">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-10 w-full sm:w-72" />
      </div>

      <div className="space-y-4">
        <Skeleton className="h-36 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    </div>
  )
}

function getDateRange(range: TimeRange, baseDate = new Date()): { from: Date | null; to: Date | null } {
  const year = baseDate.getFullYear()
  const month = baseDate.getMonth()

  switch (range) {
    case 'current_week': {
      const from = getWeekStart(baseDate)
      const to = new Date(from)
      to.setDate(from.getDate() + 6)
      return { from, to }
    }
    case 'previous_week': {
      const currentWeekStart = getWeekStart(baseDate)
      const from = new Date(currentWeekStart)
      from.setDate(currentWeekStart.getDate() - 7)
      const to = new Date(from)
      to.setDate(from.getDate() + 6)
      return { from, to }
    }
    case 'current_month': {
      return { from: new Date(year, month, 1), to: new Date(year, month + 1, 0) }
    }
    case 'previous_month': {
      return { from: new Date(year, month - 1, 1), to: new Date(year, month, 0) }
    }
    case 'current_quarter': {
      const quarterStartMonth = Math.floor(month / 3) * 3
      return { from: new Date(year, quarterStartMonth, 1), to: new Date(year, quarterStartMonth + 3, 0) }
    }
    case 'current_year': {
      return { from: new Date(year, 0, 1), to: new Date(year, 11, 31) }
    }
    case 'all':
    default:
      return { from: null, to: null }
  }
}

function getPreviousDateRange(range: TimeRange, baseDate = new Date()): { from: Date | null; to: Date | null } {
  const year = baseDate.getFullYear()
  const month = baseDate.getMonth()

  switch (range) {
    case 'current_week':
      return getDateRange('previous_week', baseDate)
    case 'previous_week': {
      const currentWeekStart = getWeekStart(baseDate)
      const from = new Date(currentWeekStart)
      from.setDate(currentWeekStart.getDate() - 14)
      const to = new Date(from)
      to.setDate(from.getDate() + 6)
      return { from, to }
    }
    case 'current_month':
      return getDateRange('previous_month', baseDate)
    case 'previous_month': {
      return { from: new Date(year, month - 2, 1), to: new Date(year, month - 1, 0) }
    }
    case 'current_quarter': {
      const quarterStartMonth = Math.floor(month / 3) * 3
      return { from: new Date(year, quarterStartMonth - 3, 1), to: new Date(year, quarterStartMonth, 0) }
    }
    case 'current_year': {
      return { from: new Date(year - 1, 0, 1), to: new Date(year - 1, 11, 31) }
    }
    case 'all':
    default:
      return { from: null, to: null }
  }
}

function formatRangeLabel(range: TimeRange, baseDate = new Date()): string {
  const year = baseDate.getFullYear()
  const month = baseDate.getMonth()

  switch (range) {
    case 'current_week': {
      const weekRange = getDateRange('current_week', baseDate)
      return `${weekRange.from?.toLocaleDateString('pl-PL')} - ${weekRange.to?.toLocaleDateString('pl-PL')}`
    }
    case 'previous_week': {
      const weekRange = getDateRange('previous_week', baseDate)
      return `${weekRange.from?.toLocaleDateString('pl-PL')} - ${weekRange.to?.toLocaleDateString('pl-PL')}`
    }
    case 'current_month':
      return `${MONTH_NAMES[month]} ${year}`
    case 'previous_month': {
      const prevMonthDate = new Date(year, month - 1, 1)
      return `${MONTH_NAMES[prevMonthDate.getMonth()]} ${prevMonthDate.getFullYear()}`
    }
    case 'current_quarter': {
      const quarter = Math.floor(month / 3) + 1
      return `Q${quarter} ${year}`
    }
    case 'current_year':
      return `${year}`
    case 'all':
    default:
      return 'Cały okres'
  }
}

function inRange(dateValue: string, range: { from: Date | null; to: Date | null }) {
  if (!range.from || !range.to) return true
  const date = new Date(dateValue)
  date.setHours(0, 0, 0, 0)

  const from = new Date(range.from)
  from.setHours(0, 0, 0, 0)

  const to = new Date(range.to)
  to.setHours(0, 0, 0, 0)

  return date >= from && date <= to
}

export default function DashboardPage() {
  const router = useRouter()
  const [accountName, setAccountName] = useState('Uzytkowniku')
  const [monthlyGoal, setMonthlyGoal] = useState<{ amount: number; currency: 'PLN' | 'EUR' } | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRange, setSelectedRange] = useState<TimeRange>('current_month')
  const [eurToPlnRate, setEurToPlnRate] = useState(DEFAULT_EUR_TO_PLN)
  const [chartGrouping, setChartGrouping] = useState<ChartGrouping>('daily')

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.replace('/auth/login')
          return
        }

        const metadata = user.user_metadata ?? {}
        const fullName =
          typeof metadata.full_name === 'string' && metadata.full_name.trim().length > 0
            ? metadata.full_name
            : typeof metadata.name === 'string' && metadata.name.trim().length > 0
              ? metadata.name
              : user.email?.split('@')[0] || 'Uzytkowniku'

        setAccountName(fullName.split(' ')[0] || 'Uzytkowniku')

        const goalAmountRaw = metadata.monthly_goal_amount
        const goalAmount =
          typeof goalAmountRaw === 'number'
            ? goalAmountRaw
            : typeof goalAmountRaw === 'string'
              ? Number(goalAmountRaw)
              : NaN
        const goalCurrency = metadata.monthly_goal_currency === 'EUR' ? 'EUR' : 'PLN'

        setMonthlyGoal(Number.isFinite(goalAmount) && goalAmount > 0 ? { amount: goalAmount, currency: goalCurrency } : null)

        const userEurRateRaw = metadata.eur_to_pln
        const userEurRate = typeof userEurRateRaw === 'number' ? userEurRateRaw : Number(userEurRateRaw)
        if (Number.isFinite(userEurRate) && userEurRate > 0) {
          setEurToPlnRate(userEurRate)
        }

        const [clientsRes, entriesRes, invoicesRes] = await Promise.all([
          supabase.from('clients').select('*').eq('user_id', user.id),
          supabase.from('work_entries').select('*').eq('user_id', user.id),
          supabase.from('invoices').select('*').eq('user_id', user.id),
        ])

        if (clientsRes.data) setClients(clientsRes.data)
        if (entriesRes.data) setWorkEntries(entriesRes.data)
        if (invoicesRes.data) setInvoices(invoicesRes.data)
      } catch (error) {
        console.error('Blad podczas ladowania dashboardu:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [router])

  const periodLabel = useMemo(() => formatRangeLabel(selectedRange), [selectedRange])

  const filteredEntries = useMemo(() => {
    const range = getDateRange(selectedRange)
    return workEntries.filter((entry) => inRange(entry.date, range))
  }, [workEntries, selectedRange])

  const previousPeriodEntries = useMemo(() => {
    const range = getPreviousDateRange(selectedRange)
    return workEntries.filter((entry) => inRange(entry.date, range))
  }, [workEntries, selectedRange])

  const totals = useMemo(() => {
    return calculateMonthlyTotals(filteredEntries, clients, eurToPlnRate)
  }, [filteredEntries, clients, eurToPlnRate])

  const previousTotals = useMemo(() => {
    return calculateMonthlyTotals(previousPeriodEntries, clients, eurToPlnRate)
  }, [previousPeriodEntries, clients, eurToPlnRate])

  const earningsTrend = useMemo(() => {
    if (selectedRange === 'all' || previousTotals.totalEarningsAllPLN <= 0) {
      return null
    }

    const change =
      ((totals.totalEarningsAllPLN - previousTotals.totalEarningsAllPLN) /
        previousTotals.totalEarningsAllPLN) *
      100

    return Number.isFinite(change) ? change : null
  }, [selectedRange, totals.totalEarningsAllPLN, previousTotals.totalEarningsAllPLN])

  const unpaidInvoices = useMemo(() => invoices.filter((inv) => !inv.is_paid), [invoices])

  const chartData = useMemo(() => {
    if (!filteredEntries.length) return []

    const clientMap = new Map(clients.map((client) => [client.id, client]))
    const grouped = new Map<
      string,
      { label: string; earningsPLN: number; earningsEUR: number; hours: number; sortDate: Date }
    >()

    const selectedRangeDates = getDateRange(selectedRange)
    if (selectedRangeDates.from && selectedRangeDates.to) {
      const cursor = new Date(selectedRangeDates.from)
      cursor.setHours(0, 0, 0, 0)
      const end = new Date(selectedRangeDates.to)
      end.setHours(0, 0, 0, 0)

      while (cursor <= end) {
        let key = ''
        let label = ''
        let sortDate = new Date(cursor)

        if (chartGrouping === 'daily') {
          key = cursor.toISOString().slice(0, 10)
          label = cursor.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })
          cursor.setDate(cursor.getDate() + 1)
        } else if (chartGrouping === 'weekly') {
          const weekStart = getWeekStart(cursor)
          key = weekStart.toISOString().slice(0, 10)
          label = getWeekLabel(weekStart)
          sortDate = weekStart
          cursor.setDate(cursor.getDate() + 7)
        } else {
          const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
          key = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`
          label = `${MONTH_NAMES[monthStart.getMonth()].slice(0, 3)} ${monthStart.getFullYear()}`
          sortDate = monthStart
          cursor.setMonth(cursor.getMonth() + 1, 1)
        }

        if (!grouped.has(key)) {
          grouped.set(key, { label, earningsPLN: 0, earningsEUR: 0, hours: 0, sortDate })
        }
      }
    }

    for (const entry of filteredEntries) {
      const entryDate = new Date(entry.date)
      let key = ''
      let label = ''
      let sortDate = new Date(entryDate)

      if (chartGrouping === 'daily') {
        key = entryDate.toISOString().slice(0, 10)
        label = entryDate.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })
      } else if (chartGrouping === 'weekly') {
        const weekStart = getWeekStart(entryDate)
        key = weekStart.toISOString().slice(0, 10)
        label = getWeekLabel(weekStart)
        sortDate = weekStart
      } else {
        key = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}`
        label = `${MONTH_NAMES[entryDate.getMonth()].slice(0, 3)} ${entryDate.getFullYear()}`
        sortDate = new Date(entryDate.getFullYear(), entryDate.getMonth(), 1)
      }

      if (!grouped.has(key)) {
        grouped.set(key, { label, earningsPLN: 0, earningsEUR: 0, hours: 0, sortDate })
      }

      const bucket = grouped.get(key)
      if (!bucket) continue

      if (entry.status === 'worked') {
        bucket.hours += entry.hours || 0
      }
      const client = entry.client_id ? clientMap.get(entry.client_id) : undefined
      const earnings = calculateEarnings(entry, client, eurToPlnRate)
      bucket.earningsPLN += earnings.amountInPLN
      if (earnings.currency === 'EUR') {
        bucket.earningsEUR += earnings.amount
      }
    }

    return Array.from(grouped.values())
      .sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime())
      .map((bucket) => ({
        label: bucket.label,
        earningsPLN: Number(bucket.earningsPLN.toFixed(2)),
        earningsEUR: Number(bucket.earningsEUR.toFixed(2)),
        hours: Number(bucket.hours.toFixed(1)),
      }))
  }, [filteredEntries, clients, chartGrouping, eurToPlnRate])

  const goalProgress = useMemo(() => {
    if (!monthlyGoal?.amount) return 0
    const target = monthlyGoal.amount
    const current = monthlyGoal.currency === 'EUR' ? totals.earningsEUR : totals.totalEarningsAllPLN
    return Math.min(100, (current / target) * 100)
  }, [monthlyGoal, totals])

  if (isLoading) {
    return <DashboardLoadingSkeleton />
  }

  return (
    <div className="container space-y-6 px-4 py-6">
      <div className="sticky top-0 z-20 -mx-4 border-b bg-background/95 px-4 pb-4 pt-2 backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Witaj, {accountName}!</h1>
            <p className="text-sm text-muted-foreground">{periodLabel}</p>
          </div>

          <div className="flex items-center gap-2">
            <Select value={selectedRange} onValueChange={(value) => setSelectedRange(value as TimeRange)}>
              <SelectTrigger className="w-full min-w-52 bg-background sm:w-64">
                <SelectValue placeholder="Wybierz okres" />
              </SelectTrigger>
              <SelectContent>
                {TIME_RANGE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Ustaw kurs EUR">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Kurs EUR → PLN</DialogTitle>
                  <DialogDescription>
                    To miejsce pod przyszłe ustawienia kursu dla wybranego okresu.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Aktualnie używany kurs</p>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={eurToPlnRate}
                    onChange={(e) => {
                      const parsed = Number(e.target.value)
                      if (Number.isFinite(parsed) && parsed > 0) {
                        setEurToPlnRate(parsed)
                      }
                    }}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Zarobki
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold">{formatCurrency(totals.totalEarningsAllPLN, 'PLN')}</div>
            {totals.earningsEUR > 0 && (
              <p className="text-sm text-muted-foreground">w tym {formatCurrency(totals.earningsEUR, 'EUR')}</p>
            )}
            {earningsTrend !== null && (
              <p className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-600">
                <ArrowUpRight className="h-3.5 w-3.5" />
                {`${earningsTrend >= 0 ? '+' : ''}${earningsTrend.toFixed(1)}% vs poprzedni okres`}
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Clock className="h-4 w-4" />
                Godziny
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.totalHours}h</div>
              <p className="text-xs text-muted-foreground">{totals.totalDays} dni pracy</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Euro className="h-4 w-4" />
                EUR
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totals.earningsEUR, 'EUR')}</div>
              <p className="text-xs text-muted-foreground">~{formatCurrency(totals.earningsEUR * eurToPlnRate, 'PLN')}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {monthlyGoal && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Target className="h-4 w-4 text-primary" />
              Cel miesięczny
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={goalProgress} className="h-2" />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{goalProgress.toFixed(0)}% celu</span>
              <span className="font-medium">{formatCurrency(monthlyGoal.amount, monthlyGoal.currency)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="space-y-3 pb-2">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base">Analiza zarobków i czasu</CardTitle>
            <Tabs value={chartGrouping} onValueChange={(value) => setChartGrouping(value as ChartGrouping)}>
              <TabsList className="h-8">
                <TabsTrigger value="daily" className="px-2 text-xs">
                  Dziennie
                </TabsTrigger>
                <TabsTrigger value="weekly" className="px-2 text-xs">
                  Tygodniowo
                </TabsTrigger>
                <TabsTrigger value="monthly" className="px-2 text-xs">
                  Miesięcznie
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <p className="text-xs text-muted-foreground">Zarobki (PLN) oraz godziny dla wybranego zakresu czasu.</p>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="flex h-64 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
              Brak danych do wyświetlenia
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                <div className="inline-flex items-center gap-1.5">
                  <Banknote className="h-3.5 w-3.5 text-primary/80" />
                  PLN
                </div>
                <div className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-[hsl(var(--chart-2))]" />
                  Godziny
                </div>
              </div>
              <ChartContainer config={chartConfig} className="h-80 min-h-[350px] w-full">
                <ComposedChart data={chartData} margin={{ left: 12, right: 14, top: 20, bottom: 8 }}>
                  <defs>
                    <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="hoursGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0.18} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    strokeOpacity={0.35}
                  />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    minTickGap={24}
                    tickMargin={10}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    yAxisId="earnings"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    width={54}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => formatCompactNumber(Number(value))}
                  />
                  <YAxis
                    yAxisId="hours"
                    orientation="right"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    width={44}
                    tick={{ fontSize: 12 }}
                  />
                  <ChartTooltip
                    cursor={{ stroke: 'hsl(var(--primary) / 0.22)', strokeDasharray: '4 4' }}
                    content={
                      <ChartTooltipContent
                        className="min-w-[220px] border-white/20 bg-background/80 px-3 py-2 shadow-2xl backdrop-blur-md supports-[backdrop-filter]:bg-background/70"
                        formatter={(value, _, item) => {
                          if (item.dataKey === 'earningsPLN') {
                            return (
                              <div className="flex w-full items-center justify-between gap-4">
                                <span className="text-muted-foreground">Zarobki (PLN)</span>
                                <span className="font-semibold tabular-nums">{formatCurrency(Number(value), 'PLN')}</span>
                              </div>
                            )
                          }
                          if (item.dataKey === 'hours') {
                            return (
                              <div className="flex w-full items-center justify-between gap-4">
                                <span className="text-muted-foreground">Godziny</span>
                                <span className="font-semibold tabular-nums">{Number(value).toFixed(1)}h</span>
                              </div>
                            )
                          }
                          return null
                        }}
                        labelFormatter={(_, payload) => {
                          const point = payload?.[0]?.payload as { label: string; earningsEUR: number } | undefined
                          if (!point) return ''
                          return (
                            <div className="space-y-1 border-b border-border/60 pb-1.5">
                              <p className="font-medium text-foreground">{point.label}</p>
                              {point.earningsEUR > 0 && (
                                <p className="text-right text-[11px] text-muted-foreground">
                                  EUR: {formatCurrency(point.earningsEUR, 'EUR')}
                                </p>
                              )}
                            </div>
                          )
                        }}
                      />
                    }
                  />
                  <Area
                    yAxisId="earnings"
                    type="monotone"
                    dataKey="earningsPLN"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    fill="url(#earningsGradient)"
                    fillOpacity={1}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0, fill: 'hsl(var(--primary))' }}
                  />
                  <Bar
                    yAxisId="hours"
                    dataKey="hours"
                    fill="url(#hoursGradient)"
                    stroke="hsl(var(--chart-2))"
                    strokeOpacity={0.35}
                    radius={[4, 4, 0, 0]}
                    barSize={18}
                  />
                </ComposedChart>
              </ChartContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <CardContent className="pt-6">
            <Users className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
            <div className="text-2xl font-bold">{clients.length}</div>
            <p className="text-xs text-muted-foreground">Klientów</p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="pt-6">
            <Calendar className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
            <div className="text-2xl font-bold">{totals.vacationDays + totals.sickDays}</div>
            <p className="text-xs text-muted-foreground">Nieobecności</p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="pt-6">
            <FileText className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
            <div className="text-2xl font-bold">{unpaidInvoices.length}</div>
            <p className="text-xs text-muted-foreground">Nieopłacone</p>
          </CardContent>
        </Card>
      </div>

      {unpaidInvoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Banknote className="h-4 w-4 text-amber-500" />
              Faktury do opłacenia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {unpaidInvoices.slice(0, 5).map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                <div>
                  <p className="text-sm font-medium">{invoice.name}</p>
                  <p className="text-xs text-muted-foreground">{invoice.billing_period || invoice.invoice_date || '-'}</p>
                </div>
                <span className="font-semibold">{formatCurrency(invoice.amount, invoice.currency)}</span>
              </div>
            ))}
            <Link href="/invoices" className="block pt-1 text-sm text-primary hover:underline">
              Zobacz wszystkie faktury
            </Link>
          </CardContent>
        </Card>
      )}

      {workEntries.length === 0 && clients.length === 0 && (
        <Card className="py-12 text-center">
          <CardContent>
            <Clock className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="mb-2 text-lg font-medium">Zacznij śledzić swój czas pracy</h3>
            <p className="mx-auto max-w-md text-sm text-muted-foreground">
              Dodaj klientów i zacznij rejestrować przepracowane godziny w kalendarzu.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
