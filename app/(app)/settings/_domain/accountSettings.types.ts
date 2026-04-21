export type InvoiceTemplateKey = 'classic' | 'modern' | 'minimal'

export type InvoiceSettings = {
  numberingPattern: string
  series: string
  branch: string
  resetSequence: 'yearly' | 'monthly'
  defaultTemplate: InvoiceTemplateKey
  templateAccentColor: string
  templateFooter: string
  autoIssueEnabled: boolean
  autoIssueDay: number
  dueDays: number
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
}

export type AccountSettingsFormValues = {
  firstName: string
  lastName: string
  username: string
}
