/**
 * Klucze mutacji — przydatne w TanStack Devtools
 * oraz do deduplikacji in-flight mutations.
 */
export const MUTATION_KEYS = {
  invoice: {
    markPaid: ['invoice', 'mark-paid'] as const,
    create:   ['invoice', 'create']    as const,
    update:   ['invoice', 'update']    as const,
    delete:   ['invoice', 'delete']    as const,
  },
  workEntry: {
    create: ['work-entry', 'create'] as const,
    update: ['work-entry', 'update'] as const,
    delete: ['work-entry', 'delete'] as const,
  },
  client: {
    create:         ['client', 'create']          as const,
    update:         ['client', 'update']          as const,
    delete:         ['client', 'delete']          as const,
    addRate:        ['client', 'add-rate']        as const,
    deleteRate:     ['client', 'delete-rate']     as const,
  },
  project: {
    create: ['project', 'create'] as const,
    update: ['project', 'update'] as const,
    delete: ['project', 'delete'] as const,
  },
} as const