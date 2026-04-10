// Database types for WorkFlow Pro

export interface Profile {
  id: string
  full_name: string | null
  email: string | null
  default_hours: number
  eur_to_pln: number
  monthly_goal_amount: number | null
  monthly_goal_currency: string
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  user_id: string
  name: string
  nip: string | null
  regon: string | null
  address: string | null
  city: string | null
  postal_code: string | null
  phone: string | null
  email: string | null
  website: string | null
  work_type: 'hourly' | 'piecework'
  rate: number
  currency: 'PLN' | 'EUR'
  unit: string | null
  is_default: boolean
  color: string
  created_at: string
}

export interface Project {
  id: string
  user_id: string
  client_id: string
  name: string
  description: string | null
  status: 'planned' | 'in_progress' | 'completed' | 'on_hold'
  budget_type: 'per_unit' | 'fixed' | 'hourly'
  budget_amount: number | null
  target_quantity: number | null
  current_quantity: number
  priority: 'low' | 'medium' | 'high'
  color: string
  start_date: string | null
  end_date: string | null
  created_at: string
}

export interface WorkEntry {
  id: string
  user_id: string
  client_id: string | null
  project_id: string | null
  date: string
  status: 'worked' | 'not_worked' | 'vacation' | 'sick_leave' | 'day_off'
  hours: number | null
  quantity: number | null
  quantity_from: number | null
  quantity_to: number | null
  category: string | null
  tags: string[]
  notes: string | null
  created_at: string
}

export interface Invoice {
  id: string
  user_id: string
  client_id: string | null
  name: string
  issue_date?: string
  invoice_date: string
  due_date: string | null
  invoice_number: string | null
  recipient: string | null
  description: string | null
  billing_period: string | null
  amount: number
  currency: 'PLN' | 'EUR'
  is_paid: boolean
  file_url: string | null
  notes: string | null
  note?: string | null
  month?: number
  year?: number
  created_at: string
}

// Form types
export interface ClientFormData {
  name: string
  nip?: string
  regon?: string
  address?: string
  city?: string
  postal_code?: string
  phone?: string
  email?: string
  website?: string
  work_type: 'hourly' | 'piecework'
  rate: number
  currency: 'PLN' | 'EUR'
  unit?: string
  is_default: boolean
  color: string
}

export interface ProjectFormData {
  client_id: string
  name: string
  description?: string
  status: 'planned' | 'in_progress' | 'completed' | 'on_hold'
  budget_type: 'per_unit' | 'fixed' | 'hourly'
  budget_amount?: number
  target_quantity?: number
  priority: 'low' | 'medium' | 'high'
  color: string
  start_date?: string
  end_date?: string
}

export interface WorkEntryFormData {
  client_id?: string
  project_id?: string
  date: string
  status: 'worked' | 'not_worked' | 'vacation' | 'sick_leave' | 'day_off'
  hours?: number
  quantity?: number
  quantity_from?: number
  quantity_to?: number
  category?: string
  tags: string[]
  notes?: string
}

export interface InvoiceFormData {
  client_id?: string
  name: string
  issue_date?: string
  invoice_date: string
  due_date?: string
  invoice_number?: string
  recipient?: string
  description?: string
  billing_period?: string
  amount: number
  currency: 'PLN' | 'EUR'
  is_paid: boolean
  file_url?: string
  notes?: string
}

// Calculated totals
export interface MonthlyTotals {
  totalHours: number
  totalDays: number
  earningsPLN: number
  earningsEUR: number
  totalEarningsAllPLN: number
  vacationDays: number
  sickDays: number
  daysOff: number
}

// Stats
export interface AdvancedStats {
  avgHourlyRate: number
  mostProductiveDay: string
  comparisonWithLastMonth: number
  workStreak: number
  totalHoursMonth: number
  totalDaysMonth: number
}

// Constants
export const WORK_CATEGORIES = [
  'Praca właściwa',
  'Spotkania',
  'Przerwa',
  'Jazda/Delegacja',
  'Czas oczekiwania',
  'Inne'
] as const

export const AVAILABLE_TAGS = [
  'delegacja',
  'home office',
  'nadgodziny',
  'weekend',
  'nocka',
  'pilne'
] as const

export const DAY_NAMES = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So'] as const
export const DAY_NAMES_FULL = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'] as const

export const MONTH_NAMES = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
] as const

export const STATUS_COLORS = {
  worked: 'bg-emerald-500',
  not_worked: 'bg-red-500',
  vacation: 'bg-blue-500',
  sick_leave: 'bg-amber-500',
  day_off: 'bg-gray-400'
} as const

export const STATUS_LABELS = {
  worked: 'Pracowałem',
  not_worked: 'Nie pracowałem',
  vacation: 'Urlop',
  sick_leave: 'L4',
  day_off: 'Dzień wolny'
} as const

export const PROJECT_STATUS_LABELS = {
  planned: 'Planowany',
  in_progress: 'W trakcie',
  completed: 'Zakończony',
  on_hold: 'Wstrzymany'
} as const

export const PRIORITY_LABELS = {
  low: 'Niski',
  medium: 'Średni',
  high: 'Wysoki'
} as const
