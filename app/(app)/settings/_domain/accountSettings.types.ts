export type InvoiceTemplateKey = 'classic' | 'modern' | 'minimal'

export type InvoiceSettings = {
  userPrefix: string
  numberingPattern: string
  series: string
  branch: string
  resetSequence: 'yearly' | 'monthly'
  defaultTemplate: InvoiceTemplateKey
  templateAccentColor: string
  templateFooter: string
  autoIssueEnabled: boolean
  autoIssueDay: number
  autoIssueClientId: string | null
  dueDays: number
}

export type InvoiceAutomationClientOption = {
  id: string
  name: string
}

export type AccountProfile = {
  id: string
  firstName: string
  lastName: string
  username: string
  email: string
  avatarPath: string | null
  avatarUrl: string | null
  invoiceSettings: InvoiceSettings
  invoiceAutomationClients: InvoiceAutomationClientOption[]
}

export type AccountSettingsFormValues = {
  firstName: string
  lastName: string
  username: string
}
