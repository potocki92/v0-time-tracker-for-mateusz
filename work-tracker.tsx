"use client"

import { Textarea } from "@/components/ui/textarea"
import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  Clock,
  DollarSign,
  User,
  Settings,
  Plus,
  Building2,
  Trash2,
  Star,
  FolderOpen,
  Download,
  X,
  Calculator,
  Edit,
  MoreHorizontal,
  Search,
  Save,
  FileText,
  CheckCircle2,
  LogOut,
  Mail,
  Lock,
  Target,
  TrendingUp,
  Award,
  Zap,
  BarChart3,
  ChevronRight,
  ChevronLeft,
  Users,
  Briefcase,
  ArrowUpRight,
  ArrowDownRight,
  Flame,
} from "lucide-react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ModeToggle } from "./components/mode-toggle"
import { useToast } from "@/hooks/use-toast"
import { Separator } from "@/components/ui/separator"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, CartesianGrid } from "recharts"
import { Progress } from "@/components/ui/progress"

interface Client {
  id: string
  name: string
  hourlyRate: number
  currency: "PLN" | "EUR"
  workType: "hourly" | "piecework"
  unit?: string
  createdAt: string
}

interface Project {
  id: string
  name: string
  clientId: string
  description?: string
  isActive: boolean
  createdAt: string
  budgetType: "hourly" | "fixed" | "per-unit"
  totalBudget?: number
  estimatedUnits?: number
  startDate?: string
  endDate?: string
  status: "planned" | "in-progress" | "completed" | "paused"
  color?: string
  emoji?: string
  priority?: "low" | "medium" | "high"
}

interface WorkDay {
  date: string
  hours: number
  quantity?: number
  status: "worked" | "not-worked" | "vacation" | "sick-leave" | "day-off" | "unset"
  clientId?: string
  projectId?: string
  category?: "work" | "meeting" | "break" | "travel" | "waiting" | "other"
  tags?: string[]
  note?: string
  quantityFrom?: number
  quantityTo?: number
}

interface MonthData {
  month: string
  year: number
  clientId: string
  defaultHours: number
  workDays: WorkDay[]
}

interface AppSettings {
  defaultClientId: string
  availableTags: string[]
  eurToPln: number
}

interface Invoice {
  id: string
  issueDate: string
  weekPeriod: string
  year: number
  month: string
  clientId?: string
  fileName?: string
  fileUrl?: string
  fileType?: string
  isPaid: boolean
  amount?: number
  currency?: "PLN" | "EUR"
  uploadedAt: string
  paidAt?: string
  note?: string
  invoiceName?: string
  billingPeriod?: string
}

interface EarningsGoal {
  monthlyTarget: number
  currency: "PLN" | "EUR"
}

interface AppUser {
  id: string
  email: string
  name: string
  createdAt: string
}

const WORK_CATEGORIES = [
  { value: "work", label: "Praca" },
  { value: "meeting", label: "Spotkania" },
  { value: "break", label: "Przerwa" },
  { value: "travel", label: "Delegacja" },
  { value: "waiting", label: "Oczekiwanie" },
  { value: "other", label: "Inne" },
]

const WORK_STATUSES = [
  { value: "unset", label: "Nie ustawiono", color: "bg-secondary border-border", icon: "" },
  { value: "worked", label: "Pracowałem", color: "bg-emerald-500/10 border-emerald-500/30 dark:bg-emerald-500/10 dark:border-emerald-500/25", icon: "W" },
  { value: "not-worked", label: "Nie pracowałem", color: "bg-rose-500/10 border-rose-500/30 dark:bg-rose-500/10 dark:border-rose-500/25", icon: "X" },
  { value: "vacation", label: "Urlop", color: "bg-sky-500/10 border-sky-500/30 dark:bg-sky-500/10 dark:border-sky-500/25", icon: "U" },
  { value: "sick-leave", label: "L4", color: "bg-amber-500/10 border-amber-500/30 dark:bg-amber-500/10 dark:border-amber-500/25", icon: "L4" },
  { value: "day-off", label: "Wolne", color: "bg-slate-500/10 border-slate-500/30 dark:bg-slate-500/10 dark:border-slate-500/25", icon: "W" },
]

const PROJECT_STATUSES = [
  { value: "planned", label: "Planowany", color: "bg-muted text-muted-foreground" },
  { value: "in-progress", label: "W trakcie", color: "bg-primary/10 text-primary" },
  { value: "completed", label: "Zakończony", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  { value: "paused", label: "Wstrzymany", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
]

const months = ["Styczeń","Luty","Marzec","Kwiecień","Maj","Czerwiec","Lipiec","Sierpień","Wrzesień","Październik","Listopad","Grudzień"]

export default function Component() {
  const { toast } = useToast()

  const [currentUser, setCurrentUser] = useState<AppUser | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "register">("login")
  const [authEmail, setAuthEmail] = useState("")
  const [authPassword, setAuthPassword] = useState("")
  const [authName, setAuthName] = useState("")

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [monthlyData, setMonthlyData] = useState<MonthData[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [appSettings, setAppSettings] = useState<AppSettings>({
    defaultClientId: "",
    availableTags: ["delegacja", "home office", "nadgodziny", "weekend"],
    eurToPln: 4.3,
  })

  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [activeTab, setActiveTab] = useState("dashboard")
  const [showClientModal, setShowClientModal] = useState(false)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [earningsGoal, setEarningsGoal] = useState<EarningsGoal>({ monthlyTarget: 0, currency: "PLN" })
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [goalAmount, setGoalAmount] = useState("")
  const [goalCurrency, setGoalCurrency] = useState<"PLN" | "EUR">("PLN")

  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [clientName, setClientName] = useState("")
  const [clientRate, setClientRate] = useState("")
  const [clientCurrency, setClientCurrency] = useState<"PLN" | "EUR">("PLN")
  const [clientWorkType, setClientWorkType] = useState<"hourly" | "piecework">("hourly")
  const [clientUnit, setClientUnit] = useState("")

  const [selectedModalDate, setSelectedModalDate] = useState("")
  const [modalHours, setModalHours] = useState("")
  const [modalQuantity, setModalQuantity] = useState("")
  const [modalStatus, setModalStatus] = useState<WorkDay["status"]>("unset")
  const [modalClient, setModalClient] = useState("")
  const [modalProject, setModalProject] = useState("")
  const [modalCategory, setModalCategory] = useState<WorkDay["category"]>("work")
  const [modalNote, setModalNote] = useState("")
  const [modalTags, setModalTags] = useState<string[]>([])

  const [invoiceClientId, setInvoiceClientId] = useState("")
  const [invoiceAmount, setInvoiceAmount] = useState("")
  const [invoiceCurrency, setInvoiceCurrency] = useState<"PLN" | "EUR">("PLN")
  const [invoiceIssueDate, setInvoiceIssueDate] = useState("")
  const [invoiceBillingPeriod, setInvoiceBillingPeriod] = useState("")
  const [invoiceName, setInvoiceName] = useState("")
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)

  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [projectName, setProjectName] = useState("")
  const [projectClientId, setProjectClientId] = useState("")
  const [projectDescription, setProjectDescription] = useState("")
  const [projectStatus, setProjectStatus] = useState<Project["status"]>("planned")

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMonth, setSelectedMonth] = useState<string>("")

  // --- Auth ---
  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser")
    if (storedUser) { setCurrentUser(JSON.parse(storedUser)) } else { setShowAuthModal(true) }
  }, [])

  useEffect(() => {
    if (!currentUser) return
    const stored = localStorage.getItem(`workTrackerData_${currentUser.id}`)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setMonthlyData(parsed.monthlyData || [])
        setClients(parsed.clients || [])
        setProjects(parsed.projects || [])
        setAppSettings(parsed.appSettings || { defaultClientId: "", availableTags: [], eurToPln: 4.3 })
        setInvoices(parsed.invoices || [])
        setEarningsGoal(parsed.earningsGoal || { monthlyTarget: 0, currency: "PLN" })
      } catch (e) { console.error("Error loading data", e) }
    }
  }, [currentUser])

  useEffect(() => {
    if (!currentUser) return
    localStorage.setItem(`workTrackerData_${currentUser.id}`, JSON.stringify({ monthlyData, clients, projects, appSettings, invoices, earningsGoal }))
  }, [monthlyData, clients, projects, appSettings, invoices, currentUser, earningsGoal])

  const handleAuth = () => {
    if (authMode === "register") {
      if (!authEmail || !authPassword || !authName) { toast({ title: "Wypełnij wszystkie pola", variant: "destructive" }); return }
      const users = JSON.parse(localStorage.getItem("users") || "[]")
      if (users.find((u: AppUser) => u.email === authEmail)) { toast({ title: "Użytkownik już istnieje", variant: "destructive" }); return }
      const newUser: AppUser = { id: Date.now().toString(), email: authEmail, name: authName, createdAt: new Date().toISOString() }
      users.push({ ...newUser, password: authPassword })
      localStorage.setItem("users", JSON.stringify(users))
      localStorage.setItem("currentUser", JSON.stringify(newUser))
      setCurrentUser(newUser)
      setShowAuthModal(false)
      toast({ title: `Witaj ${authName}!` })
    } else {
      if (!authEmail || !authPassword) { toast({ title: "Wypełnij wszystkie pola", variant: "destructive" }); return }
      if (authEmail === "test@test.pl" && authPassword === "test123") {
        const testUser: AppUser = { id: "test-user-123", email: "test@test.pl", name: "Mateusz Potocki", createdAt: new Date().toISOString() }
        localStorage.setItem("currentUser", JSON.stringify(testUser))
        setCurrentUser(testUser)
        setShowAuthModal(false)
        toast({ title: `Witaj ponownie!` })
        setAuthEmail(""); setAuthPassword(""); setAuthName("")
        return
      }
      const users = JSON.parse(localStorage.getItem("users") || "[]")
      const user = users.find((u: any) => u.email === authEmail && u.password === authPassword)
      if (!user) { toast({ title: "Nieprawidłowe dane", variant: "destructive" }); return }
      const { password, ...userWithoutPassword } = user
      localStorage.setItem("currentUser", JSON.stringify(userWithoutPassword))
      setCurrentUser(userWithoutPassword)
      setShowAuthModal(false)
      toast({ title: `Witaj ponownie!` })
    }
    setAuthEmail(""); setAuthPassword(""); setAuthName("")
  }

  const handleLogout = () => { localStorage.removeItem("currentUser"); setCurrentUser(null); setShowAuthModal(true) }

  const toggleInvoicePaid = (invoiceId: string) => {
    setInvoices((prev) => prev.map((inv) => inv.id === invoiceId ? { ...inv, isPaid: !inv.isPaid, paidAt: !inv.isPaid ? new Date().toISOString() : undefined } : inv))
    toast({ title: "Status faktury zaktualizowany" })
  }

  const unpaidInvoices = invoices.filter((inv) => !inv.isPaid)

  const getCurrentMonthData = () => monthlyData.find((m) => m.month === months[currentMonth] && m.year === currentYear)
  const currentMonthData = getCurrentMonthData()

  const calcDayEarnings = (day: WorkDay): { amount: number; currency: "PLN" | "EUR" } => {
    const client = clients.find((c) => c.id === day.clientId)
    if (!client || day.status !== "worked") return { amount: 0, currency: "PLN" }
    if (client.workType === "piecework") return { amount: (day.quantity || 0) * client.hourlyRate, currency: client.currency }
    return { amount: day.hours * client.hourlyRate, currency: client.currency }
  }

  const calculateTotals = () => {
    const empty = { totalHours: 0, totalEarningsPLN: 0, totalEarningsEUR: 0, totalEarningsAllPLN: 0, workedDays: 0, vacationDays: 0, sickDays: 0, daysOff: 0 }
    if (!currentMonthData) return empty
    let totalHours = 0, totalEarningsPLN = 0, totalEarningsEUR = 0, workedDays = 0, vacationDays = 0, sickDays = 0, daysOff = 0
    currentMonthData.workDays.forEach((day) => {
      if (day.status === "worked") {
        workedDays++; totalHours += day.hours
        const { amount, currency } = calcDayEarnings(day)
        if (currency === "EUR") totalEarningsEUR += amount; else totalEarningsPLN += amount
      } else if (day.status === "vacation") vacationDays++
      else if (day.status === "sick-leave") sickDays++
      else if (day.status === "day-off") daysOff++
    })
    const totalEarningsAllPLN = totalEarningsPLN + totalEarningsEUR * appSettings.eurToPln
    return { totalHours, totalEarningsPLN, totalEarningsEUR, totalEarningsAllPLN, workedDays, vacationDays, sickDays, daysOff }
  }

  const totals = calculateTotals()

  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate()
  const getFirstDayOfMonth = (month: number, year: number) => { const d = new Date(year, month, 1).getDay(); return d === 0 ? 6 : d - 1 }

  const openDayModal = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    setSelectedModalDate(dateStr)
    const existingDay = currentMonthData?.workDays.find((d) => d.date === dateStr)
    if (existingDay) {
      setModalHours(existingDay.hours.toString()); setModalQuantity(existingDay.quantity?.toString() || "")
      setModalStatus(existingDay.status); setModalClient(existingDay.clientId || "")
      setModalProject(existingDay.projectId || ""); setModalCategory(existingDay.category || "work")
      setModalNote(existingDay.note || ""); setModalTags(existingDay.tags || [])
    } else {
      setModalHours(""); setModalQuantity(""); setModalStatus("unset")
      setModalClient(appSettings.defaultClientId || ""); setModalProject("")
      setModalCategory("work"); setModalNote(""); setModalTags([])
    }
    setShowModal(true)
  }

  const saveWorkDay = () => {
    if (!selectedModalDate) return
    const workDay: WorkDay = {
      date: selectedModalDate, hours: Number.parseFloat(modalHours) || 0,
      quantity: modalQuantity ? Number.parseFloat(modalQuantity) : undefined, status: modalStatus,
      clientId: modalClient || undefined, projectId: modalProject || undefined,
      category: modalCategory, note: modalNote || undefined,
      tags: modalTags.length > 0 ? modalTags : undefined,
    }
    setMonthlyData((prev) => {
      const idx = prev.findIndex((m) => m.month === months[currentMonth] && m.year === currentYear)
      if (idx >= 0) {
        const updated = [...prev]
        const dayIdx = updated[idx].workDays.findIndex((d) => d.date === selectedModalDate)
        if (dayIdx >= 0) updated[idx].workDays[dayIdx] = workDay; else updated[idx].workDays.push(workDay)
        return updated
      }
      return [...prev, { month: months[currentMonth], year: currentYear, clientId: appSettings.defaultClientId || "", defaultHours: 8, workDays: [workDay] }]
    })
    setShowModal(false)
    toast({ title: "Dzień zapisany" })
  }

  const addClient = () => {
    if (!clientName || !clientRate) { toast({ title: "Wypełnij wymagane pola", variant: "destructive" }); return }
    if (editingClient) {
      setClients((prev) => prev.map((c) => c.id === editingClient.id ? { ...c, name: clientName, hourlyRate: Number.parseFloat(clientRate), currency: clientCurrency, workType: clientWorkType, unit: clientUnit } : c))
      toast({ title: "Klient zaktualizowany" })
    } else {
      const nc: Client = { id: Date.now().toString(), name: clientName, hourlyRate: Number.parseFloat(clientRate), currency: clientCurrency, workType: clientWorkType, unit: clientUnit || undefined, createdAt: new Date().toISOString() }
      setClients([...clients, nc])
      if (clients.length === 0) setAppSettings((prev) => ({ ...prev, defaultClientId: nc.id }))
      toast({ title: "Klient dodany" })
    }
    setShowClientModal(false); setEditingClient(null); setClientName(""); setClientRate(""); setClientCurrency("PLN"); setClientWorkType("hourly"); setClientUnit("")
  }

  const deleteClient = (id: string) => { setClients(clients.filter((c) => c.id !== id)); toast({ title: "Klient usunięty" }) }

  const openClientModal = (client?: Client) => {
    if (client) { setEditingClient(client); setClientName(client.name); setClientRate(client.hourlyRate.toString()); setClientCurrency(client.currency); setClientWorkType(client.workType); setClientUnit(client.unit || "") }
    else { setEditingClient(null); setClientName(""); setClientRate(""); setClientCurrency("PLN"); setClientWorkType("hourly"); setClientUnit("") }
    setShowClientModal(true)
  }

  const addProject = () => {
    if (!projectName || !projectClientId) { toast({ title: "Wypełnij wymagane pola", variant: "destructive" }); return }
    if (editingProject) {
      setProjects((prev) => prev.map((p) => p.id === editingProject.id ? { ...p, name: projectName, clientId: projectClientId, description: projectDescription, status: projectStatus } : p))
      toast({ title: "Projekt zaktualizowany" })
    } else {
      setProjects([...projects, { id: Date.now().toString(), name: projectName, clientId: projectClientId, description: projectDescription, isActive: true, status: projectStatus, budgetType: "hourly", createdAt: new Date().toISOString() }])
      toast({ title: "Projekt dodany" })
    }
    setShowProjectModal(false); setEditingProject(null); setProjectName(""); setProjectClientId(""); setProjectDescription(""); setProjectStatus("planned")
  }

  const deleteProject = (id: string) => { setProjects(projects.filter((p) => p.id !== id)); toast({ title: "Projekt usunięty" }) }

  const openProjectModal = (project?: Project) => {
    if (project) { setEditingProject(project); setProjectName(project.name); setProjectClientId(project.clientId); setProjectDescription(project.description || ""); setProjectStatus(project.status) }
    else { setEditingProject(null); setProjectName(""); setProjectClientId(""); setProjectDescription(""); setProjectStatus("planned") }
    setShowProjectModal(true)
  }

  const openInvoiceModal = (invoice?: Invoice) => {
    if (invoice) { setEditingInvoice(invoice); setInvoiceName(invoice.invoiceName || ""); setInvoiceIssueDate(invoice.issueDate); setInvoiceBillingPeriod(invoice.billingPeriod || ""); setInvoiceAmount(invoice.amount?.toString() || ""); setInvoiceCurrency(invoice.currency || "PLN"); setInvoiceClientId(invoice.clientId || "") }
    else { setEditingInvoice(null); setInvoiceName(""); setInvoiceIssueDate(""); setInvoiceBillingPeriod(""); setInvoiceAmount(""); setInvoiceCurrency("PLN"); setInvoiceClientId("") }
    setShowInvoiceModal(true)
  }

  const saveInvoice = () => {
    if (!invoiceName || !invoiceIssueDate) { toast({ title: "Wypełnij wymagane pola", variant: "destructive" }); return }
    const issueDate = new Date(invoiceIssueDate)
    const inv: Invoice = {
      id: editingInvoice?.id || Date.now().toString(), issueDate: invoiceIssueDate, weekPeriod: invoiceBillingPeriod,
      billingPeriod: invoiceBillingPeriod, invoiceName, year: issueDate.getFullYear(), month: months[issueDate.getMonth()],
      clientId: invoiceClientId, isPaid: editingInvoice?.isPaid || false, amount: Number.parseFloat(invoiceAmount) || 0,
      currency: invoiceCurrency, uploadedAt: editingInvoice?.uploadedAt || new Date().toISOString(),
    }
    if (editingInvoice) setInvoices((prev) => prev.map((i) => i.id === editingInvoice.id ? inv : i)); else setInvoices((prev) => [...prev, inv])
    setShowInvoiceModal(false); setEditingInvoice(null); setInvoiceName(""); setInvoiceIssueDate(""); setInvoiceBillingPeriod(""); setInvoiceAmount(""); setInvoiceClientId("")
    toast({ title: "Faktura zapisana" })
  }

  const deleteInvoice = (id: string) => { setInvoices(invoices.filter((i) => i.id !== id)); toast({ title: "Faktura usunięta" }) }

  const saveGoal = () => {
    const amount = Number.parseFloat(goalAmount)
    if (isNaN(amount) || amount <= 0) { toast({ title: "Podaj prawidłową kwotę", variant: "destructive" }); return }
    setEarningsGoal({ monthlyTarget: amount, currency: goalCurrency })
    setShowGoalModal(false); toast({ title: "Cel zapisany" })
  }

  const advancedStats = useMemo(() => {
    const allWorkDays = monthlyData.flatMap((m) => m.workDays.filter((w) => w.status === "worked"))
    let totalEarnings = 0, totalHours = 0
    allWorkDays.forEach((day) => {
      const client = clients.find((c) => c.id === day.clientId)
      if (client) {
        const rate = client.currency === "EUR" ? client.hourlyRate * appSettings.eurToPln : client.hourlyRate
        if (client.workType === "piecework") { totalEarnings += (day.quantity || 0) * rate } else { totalEarnings += day.hours * rate; totalHours += day.hours }
      }
    })
    const avgHourlyRate = totalHours > 0 ? totalEarnings / totalHours : 0

    const dayStats: { [key: number]: { hours: number; count: number } } = {}
    allWorkDays.forEach((day) => { const d = new Date(day.date).getDay(); if (!dayStats[d]) dayStats[d] = { hours: 0, count: 0 }; dayStats[d].hours += day.hours; dayStats[d].count += 1 })
    let mostProductiveDay = 1, maxAvgHours = 0
    Object.entries(dayStats).forEach(([day, stats]) => { const avg = stats.count > 0 ? stats.hours / stats.count : 0; if (avg > maxAvgHours) { maxAvgHours = avg; mostProductiveDay = Number.parseInt(day) } })
    const dayNames = ["Nd", "Pn", "Wt", "Sr", "Cz", "Pt", "Sb"]

    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
    const prevMonthData = monthlyData.find((m) => m.month === months[prevMonth] && m.year === prevYear)
    let prevMonthEarnings = 0
    if (prevMonthData) {
      prevMonthData.workDays.forEach((day) => {
        if (day.status === "worked") {
          const client = clients.find((c) => c.id === day.clientId)
          if (client) {
            const rate = client.currency === "EUR" ? client.hourlyRate * appSettings.eurToPln : client.hourlyRate
            if (client.workType === "hourly") prevMonthEarnings += day.hours * rate; else prevMonthEarnings += (day.quantity || 0) * rate
          }
        }
      })
    }
    const earningsChange = prevMonthEarnings > 0 ? ((totals.totalEarningsAllPLN - prevMonthEarnings) / prevMonthEarnings) * 100 : 0
    const totalMonthHours = currentMonthData?.workDays.filter((w) => w.status === "worked").reduce((sum, w) => sum + w.hours, 0) || 0

    let currentStreak = 0
    const today = new Date(); today.setHours(0, 0, 0, 0)
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today); checkDate.setDate(checkDate.getDate() - i)
      const dateStr = checkDate.toISOString().split("T")[0]
      const md = monthlyData.find((m) => m.month === months[checkDate.getMonth()] && m.year === checkDate.getFullYear())
      const dd = md?.workDays.find((w) => w.date === dateStr)
      if (dd?.status === "worked") currentStreak++; else if (i > 0) break
    }

    return { avgHourlyRate, mostProductiveDay: dayNames[mostProductiveDay], mostProductiveDayAvgHours: maxAvgHours, earningsChange, prevMonthEarnings, totalMonthHours, currentStreak, totalWorkDays: allWorkDays.length }
  }, [monthlyData, clients, appSettings.eurToPln, currentMonth, currentYear, totals.totalEarningsAllPLN, currentMonthData])

  const goalProgress = useMemo(() => {
    if (earningsGoal.monthlyTarget <= 0) return 0
    let targetInPln = earningsGoal.monthlyTarget
    if (earningsGoal.currency === "EUR") targetInPln = earningsGoal.monthlyTarget * appSettings.eurToPln
    return Math.min((totals.totalEarningsAllPLN / targetInPln) * 100, 100)
  }, [totals.totalEarningsAllPLN, earningsGoal, appSettings.eurToPln])

  const monthlyEarningsData = useMemo(() => {
    if (!currentMonthData) return []
    return currentMonthData.workDays
      .filter((d) => d.status === "worked")
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((day) => {
        const client = clients.find((c) => c.id === day.clientId)
        if (!client) return null
        let earnings = client.workType === "piecework" ? (day.quantity || 0) * client.hourlyRate : day.hours * client.hourlyRate
        if (client.currency === "EUR") earnings *= appSettings.eurToPln
        return { day: new Date(day.date).getDate().toString(), earnings }
      }).filter(Boolean) as { day: string; earnings: number }[]
  }, [currentMonthData, clients, appSettings.eurToPln])

  const filteredInvoices = useMemo(() => {
    let filtered = invoices
    if (searchTerm) filtered = filtered.filter((inv) => inv.invoiceName?.toLowerCase().includes(searchTerm.toLowerCase()) || inv.billingPeriod?.toLowerCase().includes(searchTerm.toLowerCase()))
    if (selectedMonth) filtered = filtered.filter((inv) => inv.month === selectedMonth)
    return filtered.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
  }, [invoices, searchTerm, selectedMonth])

  const fmtCurrency = (amount: number, currency: string) => {
    return `${amount.toLocaleString("pl-PL", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${currency === "EUR" ? "\u20AC" : "zł"}`
  }

  // --- AUTH SCREEN ---
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-primary mx-auto flex items-center justify-center">
              <Briefcase className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">WorkFlow Pro</h1>
            <p className="text-sm text-muted-foreground">{authMode === "login" ? "Zaloguj się" : "Utwórz konto"}</p>
          </div>
          <Card className="border-border/50 shadow-xl">
            <CardContent className="p-6 space-y-4">
              {authMode === "register" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Imię i nazwisko</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input value={authName} onChange={(e) => setAuthName(e.target.value)} className="pl-10 h-11 bg-secondary/50 border-border/50" placeholder="Jan Kowalski" />
                  </div>
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="pl-10 h-11 bg-secondary/50 border-border/50" placeholder="email@example.com" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Hasło</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="pl-10 h-11 bg-secondary/50 border-border/50" placeholder="********" />
                </div>
              </div>
              <Button onClick={handleAuth} className="w-full h-11 font-semibold">{authMode === "login" ? "Zaloguj się" : "Zarejestruj się"}</Button>
              <div className="text-center">
                <button onClick={() => setAuthMode(authMode === "login" ? "register" : "login")} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                  {authMode === "login" ? "Nie masz konta? Zarejestruj się" : "Masz konto? Zaloguj się"}
                </button>
              </div>
              <Separator />
              <p className="text-xs text-center text-muted-foreground">Test: test@test.pl / test123</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // --- MAIN APP ---
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 pb-24 lg:pb-8">
        {/* Header */}
        <header className="sticky top-0 z-50 -mx-4 px-4 pt-2 pb-3 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                <Briefcase className="w-4.5 h-4.5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-base font-bold text-foreground leading-tight">WorkFlow Pro</h1>
                <p className="text-xs text-muted-foreground leading-tight">{currentUser.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <ModeToggle />
              <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-xl h-9 w-9 text-muted-foreground hover:text-foreground">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Desktop Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full h-11 bg-secondary/50 mt-4 mb-6 hidden lg:grid lg:grid-cols-6 rounded-xl">
            {[
              { v: "dashboard", icon: BarChart3, label: "Dashboard" },
              { v: "calendar", icon: Calendar, label: "Kalendarz" },
              { v: "projects", icon: FolderOpen, label: "Projekty" },
              { v: "clients", icon: Users, label: "Klienci" },
              { v: "invoices", icon: FileText, label: "Faktury" },
              { v: "settings", icon: Settings, label: "Ustawienia" },
            ].map((t) => (
              <TabsTrigger key={t.v} value={t.v} className="rounded-lg text-sm gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <t.icon className="w-4 h-4" />
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* DASHBOARD */}
          <TabsContent value="dashboard" className="space-y-4 mt-4 lg:mt-0">
            {/* Earnings hero */}
            <Card className="border-0 bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <CardContent className="p-5">
                <p className="text-xs font-medium opacity-80 uppercase tracking-wider mb-1">{months[currentMonth]} {currentYear}</p>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold tracking-tight">{fmtCurrency(totals.totalEarningsAllPLN, "PLN")}</p>
                    {totals.totalEarningsEUR > 0 && (
                      <p className="text-sm opacity-70 mt-0.5">w tym {fmtCurrency(totals.totalEarningsEUR, "EUR")}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      {advancedStats.earningsChange >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      <span className="text-sm font-semibold">{advancedStats.earningsChange >= 0 ? "+" : ""}{advancedStats.earningsChange.toFixed(0)}%</span>
                    </div>
                    <p className="text-xs opacity-70">vs poprzedni</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick stats row */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="border-border/50">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{totals.workedDays}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Dni pracy</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{totals.totalHours.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Godzin</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Flame className="w-4 h-4 text-amber-500" />
                    <p className="text-2xl font-bold text-foreground">{advancedStats.currentStreak}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Seria dni</p>
                </CardContent>
              </Card>
            </div>

            {/* Goal progress */}
            {earningsGoal.monthlyTarget > 0 && (
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">Cel miesieczny</span>
                    </div>
                    <span className="text-sm font-bold text-primary">{goalProgress.toFixed(0)}%</span>
                  </div>
                  <Progress value={goalProgress} className="h-2" />
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>{fmtCurrency(totals.totalEarningsAllPLN, "PLN")}</span>
                    <span>{fmtCurrency(earningsGoal.currency === "EUR" ? earningsGoal.monthlyTarget * appSettings.eurToPln : earningsGoal.monthlyTarget, "PLN")}</span>
                  </div>
                  {goalProgress >= 100 && (
                    <div className="flex items-center gap-2 mt-3 p-2 rounded-lg bg-primary/10">
                      <Award className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-primary">Cel osiagniety!</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            <Button variant="outline" size="sm" className="w-full" onClick={() => { setGoalAmount(earningsGoal.monthlyTarget > 0 ? earningsGoal.monthlyTarget.toString() : ""); setGoalCurrency(earningsGoal.currency); setShowGoalModal(true) }}>
              <Target className="w-4 h-4 mr-2" />{earningsGoal.monthlyTarget > 0 ? "Edytuj cel" : "Ustaw cel miesieczny"}
            </Button>

            {/* Unpaid invoices */}
            {unpaidInvoices.length > 0 && (
              <Card className="border-amber-500/20 bg-amber-500/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                    <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    Niezapłacone faktury ({unpaidInvoices.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  {unpaidInvoices.map((inv) => {
                    const client = clients.find((c) => c.id === inv.clientId)
                    return (
                      <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/50">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <button onClick={() => toggleInvoicePaid(inv.id)} className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center hover:bg-primary/10 transition-colors shrink-0" aria-label="Oznacz jako opłaconą">
                            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          </button>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate text-foreground">{inv.invoiceName || "Faktura"}</p>
                            <p className="text-xs text-muted-foreground truncate">{client?.name}{inv.billingPeriod ? ` \u2022 ${inv.billingPeriod}` : ""}</p>
                          </div>
                        </div>
                        {inv.amount != null && inv.amount > 0 && (
                          <p className="text-sm font-bold whitespace-nowrap ml-3 text-foreground">{fmtCurrency(inv.amount, inv.currency || "PLN")}</p>
                        )}
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            )}

            {/* Advanced stats */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <TrendingUp className="w-4 h-4 text-primary" />Statystyki
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-secondary/50">
                    <p className="text-xs text-muted-foreground">Sr. stawka/h</p>
                    <p className="text-lg font-bold text-foreground">{advancedStats.avgHourlyRate.toFixed(0)} zł</p>
                  </div>
                  <div className="p-3 rounded-xl bg-secondary/50">
                    <p className="text-xs text-muted-foreground">Najlepszy dzien</p>
                    <p className="text-lg font-bold text-foreground">{advancedStats.mostProductiveDay}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-secondary/50">
                    <p className="text-xs text-muted-foreground">Godzin w mies.</p>
                    <p className="text-lg font-bold text-foreground">{advancedStats.totalMonthHours.toFixed(0)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-secondary/50">
                    <p className="text-xs text-muted-foreground">Laczne dni pracy</p>
                    <p className="text-lg font-bold text-foreground">{advancedStats.totalWorkDays}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chart */}
            {monthlyEarningsData.length > 0 && (
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-foreground">Zarobki dzienne (PLN)</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyEarningsData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="day" className="text-[10px]" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis className="text-[10px]" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                        <RTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} formatter={(value: number) => [`${value.toFixed(0)} zł`, "Zarobki"]} />
                        <Bar dataKey="earnings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* CALENDAR */}
          <TabsContent value="calendar" className="space-y-4 mt-4 lg:mt-0">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1) } else setCurrentMonth(currentMonth - 1) }}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <h2 className="text-lg font-bold text-foreground">{months[currentMonth]} {currentYear}</h2>
              <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1) } else setCurrentMonth(currentMonth + 1) }}>
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            <Card className="border-border/50">
              <CardContent className="p-3 sm:p-4">
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {["Pn", "Wt", "Sr", "Cz", "Pt", "Sb", "Nd"].map((d) => (
                    <div key={d} className="text-center text-[10px] sm:text-xs font-semibold text-muted-foreground py-1">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: getFirstDayOfMonth(currentMonth, currentYear) }).map((_, i) => <div key={`e-${i}`} />)}
                  {Array.from({ length: getDaysInMonth(currentMonth, currentYear) }).map((_, i) => {
                    const day = i + 1
                    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                    const workDay = currentMonthData?.workDays.find((d) => d.date === dateStr)
                    const statusConfig = WORK_STATUSES.find((s) => s.value === (workDay?.status || "unset"))
                    const client = workDay?.clientId ? clients.find((c) => c.id === workDay.clientId) : null
                    const isToday = dateStr === new Date().toISOString().split("T")[0]
                    const isFuture = new Date(dateStr) > new Date()

                    return (
                      <button
                        key={day}
                        onClick={() => !isFuture && openDayModal(day)}
                        disabled={isFuture}
                        className={`relative aspect-square rounded-lg border text-left p-1 sm:p-1.5 transition-all flex flex-col overflow-hidden
                          ${isFuture ? "opacity-30 cursor-not-allowed border-transparent" : "hover:ring-2 hover:ring-primary/30 cursor-pointer"}
                          ${isToday ? "ring-2 ring-primary" : ""}
                          ${statusConfig?.color || "bg-secondary/30 border-border/50"}
                        `}
                      >
                        <span className={`text-[10px] sm:text-xs font-semibold leading-none ${isToday ? "text-primary" : "text-foreground"}`}>{day}</span>
                        {workDay && workDay.status === "worked" && client && (
                          <div className="mt-auto">
                            <p className="text-[9px] sm:text-[10px] font-bold leading-tight text-foreground">
                              {client.workType === "piecework" && workDay.quantity ? fmtCurrency(workDay.quantity * client.hourlyRate, client.currency) : fmtCurrency(workDay.hours * client.hourlyRate, client.currency)}
                            </p>
                          </div>
                        )}
                        {workDay && workDay.status !== "worked" && workDay.status !== "unset" && (
                          <span className="mt-auto text-[8px] sm:text-[9px] font-medium opacity-70 text-foreground">{statusConfig?.icon}</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Summary under calendar */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="border-border/50">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Clock className="w-4 h-4 text-primary" /></div>
                  <div><p className="text-xs text-muted-foreground">Godziny</p><p className="text-lg font-bold text-foreground">{totals.totalHours.toFixed(1)}</p></div>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><DollarSign className="w-4 h-4 text-primary" /></div>
                  <div><p className="text-xs text-muted-foreground">Zarobki</p><p className="text-lg font-bold text-foreground">{fmtCurrency(totals.totalEarningsAllPLN, "PLN")}</p></div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* PROJECTS */}
          <TabsContent value="projects" className="space-y-4 mt-4 lg:mt-0">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Projekty</h2>
              <Button size="sm" onClick={() => openProjectModal()} className="gap-1.5"><Plus className="w-4 h-4" />Dodaj</Button>
            </div>
            {projects.length === 0 ? (
              <Card className="border-border/50 border-dashed">
                <CardContent className="p-8 text-center">
                  <FolderOpen className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Brak projektów</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {projects.map((project) => {
                  const client = clients.find((c) => c.id === project.clientId)
                  const sc = PROJECT_STATUSES.find((s) => s.value === project.status)
                  return (
                    <Card key={project.id} className="border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground truncate">{project.name}</p>
                            {client && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Building2 className="w-3 h-3" />{client.name}</p>}
                            {project.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{project.description}</p>}
                            <Badge className={`${sc?.color} mt-2 text-[10px]`}>{sc?.label}</Badge>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="rounded-lg h-8 w-8 shrink-0"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openProjectModal(project)}><Edit className="w-4 h-4 mr-2" />Edytuj</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => deleteProject(project.id)} className="text-destructive"><Trash2 className="w-4 h-4 mr-2" />Usun</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* CLIENTS */}
          <TabsContent value="clients" className="space-y-4 mt-4 lg:mt-0">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Klienci</h2>
              <Button size="sm" onClick={() => openClientModal()} className="gap-1.5"><Plus className="w-4 h-4" />Dodaj</Button>
            </div>
            {clients.length === 0 ? (
              <Card className="border-border/50 border-dashed">
                <CardContent className="p-8 text-center">
                  <Users className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Brak klientów</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {clients.map((client) => (
                  <Card key={client.id} className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            {client.workType === "hourly" ? <Clock className="w-5 h-5 text-primary" /> : <Calculator className="w-5 h-5 text-primary" />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate flex items-center gap-1.5">
                              {client.name}
                              {appSettings.defaultClientId === client.id && <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {client.hourlyRate} {client.currency === "EUR" ? "\u20AC" : "zł"}{client.workType === "piecework" && client.unit ? `/${client.unit}` : "/h"}
                            </p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="rounded-lg h-8 w-8 shrink-0"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openClientModal(client)}><Edit className="w-4 h-4 mr-2" />Edytuj</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setAppSettings((prev) => ({ ...prev, defaultClientId: client.id })); toast({ title: "Ustawiono jako domyślny" }) }}><Star className="w-4 h-4 mr-2" />Domyślny</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => deleteClient(client.id)} className="text-destructive"><Trash2 className="w-4 h-4 mr-2" />Usun</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* INVOICES */}
          <TabsContent value="invoices" className="space-y-4 mt-4 lg:mt-0">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Faktury</h2>
              <Button size="sm" onClick={() => openInvoiceModal()} className="gap-1.5"><Plus className="w-4 h-4" />Dodaj</Button>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Szukaj..." className="pl-9 h-9 bg-secondary/50 border-border/50" />
              </div>
              <Select value={selectedMonth || "all"} onValueChange={(v) => setSelectedMonth(v === "all" ? "" : v)}>
                <SelectTrigger className="w-36 h-9 bg-secondary/50 border-border/50"><SelectValue placeholder="Miesiąc" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie</SelectItem>
                  {months.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {filteredInvoices.length === 0 ? (
              <Card className="border-border/50 border-dashed">
                <CardContent className="p-8 text-center">
                  <FileText className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Brak faktur</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {filteredInvoices.map((inv) => {
                  const client = clients.find((c) => c.id === inv.clientId)
                  return (
                    <Card key={inv.id} className={`border-border/50 transition-opacity ${inv.isPaid ? "opacity-50" : ""}`}>
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <button onClick={() => toggleInvoicePaid(inv.id)} className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${inv.isPaid ? "bg-primary/10" : "bg-amber-500/10"}`} aria-label={inv.isPaid ? "Oznacz jako nieopłaconą" : "Oznacz jako opłaconą"}>
                            {inv.isPaid ? <CheckCircle2 className="w-4.5 h-4.5 text-primary" /> : <Clock className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate text-foreground ${inv.isPaid ? "line-through" : ""}`}>{inv.invoiceName || "Faktura"}</p>
                            <p className="text-xs text-muted-foreground truncate">{client?.name}{inv.billingPeriod ? ` \u2022 ${inv.billingPeriod}` : ""}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {inv.amount != null && inv.amount > 0 && <p className="text-sm font-bold whitespace-nowrap text-foreground">{fmtCurrency(inv.amount, inv.currency || "PLN")}</p>}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg"><MoreHorizontal className="w-3.5 h-3.5" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openInvoiceModal(inv)}><Edit className="w-4 h-4 mr-2" />Edytuj</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => deleteInvoice(inv.id)} className="text-destructive"><Trash2 className="w-4 h-4 mr-2" />Usun</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* SETTINGS */}
          <TabsContent value="settings" className="space-y-4 mt-4 lg:mt-0">
            <h2 className="text-lg font-bold text-foreground">Ustawienia</h2>
            <Card className="border-border/50">
              <CardContent className="p-4 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Kurs EUR/PLN</Label>
                  <Input type="number" step="0.01" value={appSettings.eurToPln} onChange={(e) => setAppSettings({ ...appSettings, eurToPln: Number.parseFloat(e.target.value) || 4.3 })} className="h-10 bg-secondary/50 border-border/50" />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tagi</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {(appSettings.availableTags || []).map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="gap-1 pr-1 text-foreground">
                        {tag}
                        <button onClick={() => setAppSettings({ ...appSettings, availableTags: appSettings.availableTags.filter((_, i) => i !== idx) })} className="hover:text-destructive rounded-sm"><X className="w-3 h-3" /></button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input placeholder="Nowy tag..." className="h-9 bg-secondary/50 border-border/50" onKeyDown={(e) => { if (e.key === "Enter") { const v = e.currentTarget.value; if (v && !(appSettings.availableTags || []).includes(v)) { setAppSettings({ ...appSettings, availableTags: [...(appSettings.availableTags || []), v] }); e.currentTarget.value = "" } } }} />
                    <Button size="sm" variant="secondary" onClick={(e) => { const input = e.currentTarget.previousElementSibling as HTMLInputElement; if (input?.value && !(appSettings.availableTags || []).includes(input.value)) { setAppSettings({ ...appSettings, availableTags: [...(appSettings.availableTags || []), input.value] }); input.value = "" } }}><Plus className="w-4 h-4" /></Button>
                  </div>
                </div>
                <Separator />
                <Button variant="outline" className="w-full" onClick={() => {
                  const dataStr = JSON.stringify({ monthlyData, clients, projects, appSettings, invoices, earningsGoal }, null, 2)
                  const link = document.createElement("a"); link.href = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`
                  link.download = `workflow-pro-backup-${new Date().toISOString().split("T")[0]}.json`; link.click()
                  toast({ title: "Dane wyeksportowane" })
                }}>
                  <Download className="w-4 h-4 mr-2" />Eksportuj dane
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Mobile Bottom Nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card/95 backdrop-blur-xl border-t border-border/50">
          <div className="flex items-center justify-around py-1.5 px-2 max-w-lg mx-auto">
            {[
              { v: "dashboard", icon: BarChart3, label: "Home" },
              { v: "calendar", icon: Calendar, label: "Kalendarz" },
              { v: "projects", icon: FolderOpen, label: "Projekty" },
              { v: "clients", icon: Users, label: "Klienci" },
              { v: "invoices", icon: FileText, label: "Faktury" },
              { v: "settings", icon: Settings, label: "Więcej" },
            ].map((t) => (
              <button key={t.v} onClick={() => setActiveTab(t.v)} className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors ${activeTab === t.v ? "text-primary" : "text-muted-foreground"}`}>
                <t.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{t.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* --- MODALS --- */}

        {/* Work Day Modal */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-foreground">{selectedModalDate && new Date(selectedModalDate).toLocaleDateString("pl-PL", { year: "numeric", month: "long", day: "numeric" })}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</Label>
                <Select value={modalStatus} onValueChange={(v) => setModalStatus(v as WorkDay["status"])}>
                  <SelectTrigger><SelectValue placeholder="Wybierz status" /></SelectTrigger>
                  <SelectContent>{WORK_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {modalStatus === "worked" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5"><Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Godziny</Label><Input type="number" step="0.5" value={modalHours} onChange={(e) => setModalHours(e.target.value)} /></div>
                    <div className="space-y-1.5"><Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{"Ilość (akord)"}</Label><Input type="number" value={modalQuantity} onChange={(e) => setModalQuantity(e.target.value)} placeholder="Opcjonalne" /></div>
                  </div>
                  <div className="space-y-1.5"><Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Klient</Label>
                    <Select value={modalClient} onValueChange={setModalClient}><SelectTrigger><SelectValue placeholder="Wybierz klienta" /></SelectTrigger>
                      <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
                  </div>
                  <div className="space-y-1.5"><Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Projekt</Label>
                    <Select value={modalProject} onValueChange={setModalProject}><SelectTrigger><SelectValue placeholder="Opcjonalnie" /></SelectTrigger>
                      <SelectContent><SelectItem value="none">Brak</SelectItem>{projects.filter((p) => p.clientId === modalClient).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
                  </div>
                  <div className="space-y-1.5"><Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Kategoria</Label>
                    <Select value={modalCategory} onValueChange={(v) => setModalCategory(v as WorkDay["category"])}><SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{WORK_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select>
                  </div>
                  <div className="space-y-1.5"><Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Notatka</Label>
                    <Textarea value={modalNote} onChange={(e) => setModalNote(e.target.value)} rows={2} placeholder="Opcjonalnie..." className="resize-none" />
                  </div>
                  <div className="space-y-1.5"><Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tagi</Label>
                    <div className="flex flex-wrap gap-1.5">{(appSettings.availableTags || []).map((tag) => (
                      <Badge key={tag} variant={modalTags.includes(tag) ? "default" : "outline"} className="cursor-pointer text-xs" onClick={() => setModalTags(modalTags.includes(tag) ? modalTags.filter((t) => t !== tag) : [...modalTags, tag])}>{tag}</Badge>
                    ))}</div>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowModal(false)}>Anuluj</Button>
              <Button onClick={saveWorkDay}><Save className="w-4 h-4 mr-2" />Zapisz</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Client Modal */}
        <Dialog open={showClientModal} onOpenChange={setShowClientModal}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle className="text-foreground">{editingClient ? "Edytuj klienta" : "Dodaj klienta"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5"><Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nazwa</Label><Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="np. ABC Sp. z o.o." /></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Typ pracy</Label>
                <Select value={clientWorkType} onValueChange={(v) => setClientWorkType(v as "hourly" | "piecework")}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="hourly">Godzinowa</SelectItem><SelectItem value="piecework">Akordowa</SelectItem></SelectContent></Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Stawka</Label><Input type="number" step="0.01" value={clientRate} onChange={(e) => setClientRate(e.target.value)} /></div>
                <div className="space-y-1.5"><Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Waluta</Label>
                  <Select value={clientCurrency} onValueChange={(v) => setClientCurrency(v as "PLN" | "EUR")}><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="PLN">PLN</SelectItem><SelectItem value="EUR">EUR</SelectItem></SelectContent></Select>
                </div>
              </div>
              {clientWorkType === "piecework" && (
                <div className="space-y-1.5"><Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Jednostka</Label><Input value={clientUnit} onChange={(e) => setClientUnit(e.target.value)} placeholder="np. kW, szt, m2" /></div>
              )}
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setShowClientModal(false)}>Anuluj</Button><Button onClick={addClient}><Save className="w-4 h-4 mr-2" />Zapisz</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Project Modal */}
        <Dialog open={showProjectModal} onOpenChange={setShowProjectModal}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle className="text-foreground">{editingProject ? "Edytuj projekt" : "Dodaj projekt"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5"><Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nazwa</Label><Input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="np. Instalacja PV" /></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Klient</Label>
                <Select value={projectClientId} onValueChange={setProjectClientId}><SelectTrigger><SelectValue placeholder="Wybierz" /></SelectTrigger>
                  <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-1.5"><Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</Label>
                <Select value={projectStatus} onValueChange={(v) => setProjectStatus(v as Project["status"])}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PROJECT_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-1.5"><Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Opis</Label><Textarea value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)} rows={2} placeholder="Opcjonalnie..." className="resize-none" /></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setShowProjectModal(false)}>Anuluj</Button><Button onClick={addProject}><Save className="w-4 h-4 mr-2" />Zapisz</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Invoice Modal */}
        <Dialog open={showInvoiceModal} onOpenChange={setShowInvoiceModal}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle className="text-foreground">{editingInvoice ? "Edytuj fakturę" : "Dodaj fakturę"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5"><Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nazwa faktury</Label><Input value={invoiceName} onChange={(e) => setInvoiceName(e.target.value)} placeholder="np. FV 01/2025" /></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Data wystawienia</Label><Input type="date" value={invoiceIssueDate} onChange={(e) => setInvoiceIssueDate(e.target.value)} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Okres rozliczeniowy</Label><Input value={invoiceBillingPeriod} onChange={(e) => setInvoiceBillingPeriod(e.target.value)} placeholder="np. 01.09-07.09" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Kwota</Label><Input type="number" step="0.01" value={invoiceAmount} onChange={(e) => setInvoiceAmount(e.target.value)} /></div>
                <div className="space-y-1.5"><Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Waluta</Label>
                  <Select value={invoiceCurrency} onValueChange={(v) => setInvoiceCurrency(v as "PLN" | "EUR")}><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="PLN">PLN</SelectItem><SelectItem value="EUR">EUR</SelectItem></SelectContent></Select>
                </div>
              </div>
              <div className="space-y-1.5"><Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Klient</Label>
                <Select value={invoiceClientId} onValueChange={setInvoiceClientId}><SelectTrigger><SelectValue placeholder="Wybierz" /></SelectTrigger>
                  <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setShowInvoiceModal(false)}>Anuluj</Button><Button onClick={saveInvoice}><Save className="w-4 h-4 mr-2" />Zapisz</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Goal Modal */}
        <Dialog open={showGoalModal} onOpenChange={setShowGoalModal}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle className="text-foreground">Cel miesieczny</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5"><Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Kwota docelowa</Label><Input type="number" value={goalAmount} onChange={(e) => setGoalAmount(e.target.value)} placeholder="np. 10000" /></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Waluta</Label>
                <Select value={goalCurrency} onValueChange={(v) => setGoalCurrency(v as "PLN" | "EUR")}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="PLN">PLN</SelectItem><SelectItem value="EUR">EUR</SelectItem></SelectContent></Select>
              </div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setShowGoalModal(false)}>Anuluj</Button><Button onClick={saveGoal}>Zapisz cel</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
