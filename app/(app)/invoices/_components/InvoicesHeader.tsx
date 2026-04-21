import { Bot, Download, Plus, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface InvoicesHeaderProps {
  onCreate: () => void
  onExportAccounting: () => void
  onImportAccounting: () => void
  onRunAutoIssue: () => void
  isAutoIssueRunning: boolean
}

export function InvoicesHeader({
  onCreate,
  onExportAccounting,
  onImportAccounting,
  onRunAutoIssue,
  isAutoIssueRunning,
}: InvoicesHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Faktury</h1>
        <p className="text-muted-foreground">Zarządzaj fakturami klientów i kontroluj płatności.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={onExportAccounting}>
          <Download className="mr-2 h-4 w-4" />
          Eksport CSV
        </Button>
        <Button variant="outline" onClick={onImportAccounting}>
          <Upload className="mr-2 h-4 w-4" />
          Import CSV
        </Button>
        <Button variant="outline" onClick={onRunAutoIssue} disabled={isAutoIssueRunning}>
          <Bot className="mr-2 h-4 w-4" />
          {isAutoIssueRunning ? 'Generowanie...' : 'Auto-fakturowanie'}
        </Button>
        <Button onClick={onCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Dodaj fakturę
        </Button>
      </div>
    </div>
  )
}
