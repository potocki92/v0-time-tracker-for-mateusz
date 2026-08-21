import type { DashboardData } from '../domain'

/**
 * Selektory zdefiniowane na poziomie modulu, nie inline w komponencie.
 * TanStack cache'uje wynik `select` po referencji funkcji — strzalka tworzona
 * przy kazdym renderze wymusza ponowne przeliczenie (choc structural sharing
 * i tak utrzyma stabilna referencje wyniku).
 */
export const selectUserName = (data: DashboardData) => data.userName
export const selectClients = (data: DashboardData) => data.clients
export const selectWorkEntries = (data: DashboardData) => data.workEntries
export const selectInvoices = (data: DashboardData) => data.invoices
export const selectProjects = (data: DashboardData) => data.projects
