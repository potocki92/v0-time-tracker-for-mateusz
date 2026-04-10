'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { 
  Clock, 
  Euro, 
  Banknote, 
  TrendingUp, 
  Calendar,
  Target,
  Users,
  FileText
} from 'lucide-react'
import type { Client, WorkEntry, Invoice, Profile } from '@/lib/types'
import { MONTH_NAMES } from '@/lib/types'
import { calculateMonthlyTotals, formatCurrency } from '@/lib/helpers'

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const currentDate = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) return

        // Load all data in parallel
        const [profileRes, clientsRes, entriesRes, invoicesRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', user.id).single(),
          supabase.from('clients').select('*').eq('user_id', user.id),
          supabase.from('work_entries').select('*').eq('user_id', user.id),
          supabase.from('invoices').select('*').eq('user_id', user.id),
        ])

        if (profileRes.data) setProfile(profileRes.data)
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
  }, [])

  // Calculate current month entries
  const currentMonthEntries = useMemo(() => {
    return workEntries.filter(entry => {
      const date = new Date(entry.date)
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    })
  }, [workEntries, currentMonth, currentYear])

  // Calculate totals
  const totals = useMemo(() => {
    const eurToPln = profile?.eur_to_pln || 4.30
    return calculateMonthlyTotals(currentMonthEntries, clients, eurToPln)
  }, [currentMonthEntries, clients, profile])

  // Unpaid invoices
  const unpaidInvoices = useMemo(() => {
    return invoices.filter(inv => !inv.is_paid)
  }, [invoices])

  // Goal progress
  const goalProgress = useMemo(() => {
    if (!profile?.monthly_goal_amount) return 0
    const target = profile.monthly_goal_amount
    const current = profile.monthly_goal_currency === 'EUR' 
      ? totals.earningsEUR 
      : totals.totalEarningsAllPLN
    return Math.min(100, (current / target) * 100)
  }, [profile, totals])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-muted-foreground">Ladowanie...</div>
      </div>
    )
  }

  return (
    <div className="container px-4 py-6 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          Witaj, {profile?.full_name?.split(' ')[0] || 'Uzytkowniku'}!
        </h1>
        <p className="text-muted-foreground">
          {MONTH_NAMES[currentMonth]} {currentYear}
        </p>
      </div>

      {/* Main Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Total Earnings PLN */}
        <Card className="col-span-2 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Zarobki w tym miesiacu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(totals.totalEarningsAllPLN, 'PLN')}
            </div>
            {totals.earningsEUR > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                w tym {formatCurrency(totals.earningsEUR, 'EUR')}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Hours */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Godziny
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalHours}h</div>
            <p className="text-xs text-muted-foreground">{totals.totalDays} dni</p>
          </CardContent>
        </Card>

        {/* EUR Earnings */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Euro className="w-4 h-4" />
              EUR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.earningsEUR, 'EUR')}</div>
            <p className="text-xs text-muted-foreground">
              ~{formatCurrency(totals.earningsEUR * (profile?.eur_to_pln || 4.30), 'PLN')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Goal */}
      {profile?.monthly_goal_amount && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Cel miesieczny
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={goalProgress} className="h-2" />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {goalProgress.toFixed(0)}% celu
              </span>
              <span className="font-medium">
                {formatCurrency(profile.monthly_goal_amount, profile.monthly_goal_currency as 'PLN' | 'EUR')}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid gap-4 grid-cols-3">
        <Card className="text-center">
          <CardContent className="pt-6">
            <Users className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
            <div className="text-2xl font-bold">{clients.length}</div>
            <p className="text-xs text-muted-foreground">Klientow</p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="pt-6">
            <Calendar className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
            <div className="text-2xl font-bold">{totals.vacationDays + totals.sickDays}</div>
            <p className="text-xs text-muted-foreground">Nieobecnosci</p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="pt-6">
            <FileText className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
            <div className="text-2xl font-bold">{unpaidInvoices.length}</div>
            <p className="text-xs text-muted-foreground">Nieoplacone</p>
          </CardContent>
        </Card>
      </div>

      {/* Unpaid Invoices */}
      {unpaidInvoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Banknote className="w-4 h-4 text-amber-500" />
              Faktury do oplacenia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {unpaidInvoices.slice(0, 5).map((invoice) => (
              <div 
                key={invoice.id} 
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div>
                  <p className="font-medium text-sm">{invoice.name}</p>
                  <p className="text-xs text-muted-foreground">{invoice.billing_period}</p>
                </div>
                <span className="font-semibold">
                  {formatCurrency(invoice.amount, invoice.currency)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {workEntries.length === 0 && clients.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">Zacznij sledzic swoj czas pracy</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Dodaj klientow i zacznij rejestrowac przepracowane godziny w kalendarzu.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
