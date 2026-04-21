import { useId } from 'react'

interface ProjectsDashboardSearchProps {
  query: string
  onQueryChange: (value: string) => void
}

export function ProjectsDashboardSearch({ query, onQueryChange }: ProjectsDashboardSearchProps) {
  const searchId = useId()

  return (
    <div className="w-full sm:max-w-xs">
      <label htmlFor={searchId} className="sr-only">
        Wyszukaj projekt po tytule
      </label>
      <input
        id={searchId}
        type="search"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Szukaj po tytule projektu"
        aria-label="Wyszukaj projekt po tytule"
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  )
}
