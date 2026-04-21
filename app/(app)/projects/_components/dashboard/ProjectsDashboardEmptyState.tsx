interface ProjectsDashboardEmptyStateProps {
  message: string
}

export function ProjectsDashboardEmptyState({ message }: ProjectsDashboardEmptyStateProps) {
  return (
    <div
      className="rounded-xl border border-dashed border-border bg-muted/40 p-8 text-center"
      role="status"
      aria-live="polite"
    >
      <h3 className="text-lg font-semibold text-foreground">Brak projektów</h3>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
