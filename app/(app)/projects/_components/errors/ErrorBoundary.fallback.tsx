'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ErrorBoundaryFallbackProps } from './ErrorBoundary.types'

export function DefaultFallback({ error, resetError }: ErrorBoundaryFallbackProps) {
  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" aria-hidden />
          Wystąpił błąd
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          {error.message || 'Nieznany błąd. Spróbuj odświeżyć tę sekcję.'}
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={resetError}
          className="h-7 gap-1.5 text-xs"
          aria-label="Spróbuj ponownie załadować sekcję"
        >
          <RefreshCw className="h-3 w-3" aria-hidden />
          Spróbuj ponownie
        </Button>
      </CardContent>
    </Card>
  )
}
