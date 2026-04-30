'use client'

import { Bot, Download, FlaskConical, MoreVertical, Plus, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface InvoicesHeaderProps {
  onCreate: () => void
  onExportAccounting: () => void
  onImportAccounting: () => void
  onRunAutoIssue: () => void
  onCreateTestInvoice: () => void
  isAutoIssueRunning: boolean
  isCreatingTestInvoice: boolean
}

export function InvoicesHeader({
  onCreate,
  onExportAccounting,
  onImportAccounting,
  onRunAutoIssue,
  onCreateTestInvoice,
  isAutoIssueRunning,
  isCreatingTestInvoice,
}: InvoicesHeaderProps) {
  const autoIssueBusy = isAutoIssueRunning
  const testBusy = isCreatingTestInvoice || isAutoIssueRunning

  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Faktury</h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Zarządzaj fakturami klientów i kontroluj płatności.
        </p>
      </div>

      {/* Mobile: primary CTA + actions menu. Keeps the top clean on small screens. */}
      <div className="flex items-center gap-2 md:hidden">
        <Button onClick={onCreate} className="h-11 flex-1 gap-2 rounded-xl">
          <Plus className="size-4" />
          Dodaj fakturę
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 shrink-0 rounded-xl"
              aria-label="Więcej akcji"
            >
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={onRunAutoIssue} disabled={autoIssueBusy}>
              <Bot className="size-4" />
              {autoIssueBusy ? 'Generowanie...' : 'Auto-fakturowanie'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onCreateTestInvoice} disabled={testBusy}>
              <FlaskConical className="size-4" />
              {isCreatingTestInvoice ? 'Tworzenie testu...' : 'Utwórz testową fakturę'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onExportAccounting}>
              <Download className="size-4" />
              Eksport CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onImportAccounting}>
              <Upload className="size-4" />
              Import CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Desktop: full action row. */}
      <div className="hidden flex-wrap gap-2 md:flex">
        <Button variant="outline" onClick={onExportAccounting}>
          <Download className="mr-2 size-4" />
          Eksport CSV
        </Button>
        <Button variant="outline" onClick={onImportAccounting}>
          <Upload className="mr-2 size-4" />
          Import CSV
        </Button>
        <Button variant="outline" onClick={onRunAutoIssue} disabled={autoIssueBusy}>
          <Bot className="mr-2 size-4" />
          {autoIssueBusy ? 'Generowanie...' : 'Auto-fakturowanie'}
        </Button>
        <Button variant="outline" onClick={onCreateTestInvoice} disabled={testBusy}>
          <FlaskConical className="mr-2 size-4" />
          {isCreatingTestInvoice ? 'Tworzenie testu...' : 'Utwórz testową fakturę'}
        </Button>
        <Button onClick={onCreate}>
          <Plus className="mr-2 size-4" />
          Dodaj fakturę
        </Button>
      </div>
    </header>
  )
}
