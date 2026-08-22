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
    autoIssue: ['invoice', 'auto-issue'] as const,
    updateStatus: ['invoice', 'update-status'] as const,
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
  account: {
    updateProfile: ['account', 'update-profile'] as const,
    uploadAvatar:  ['account', 'upload-avatar']  as const,
    updateInvoiceSettings: ['account', 'update-invoice-settings'] as const,
    updateWeeklySummaryEmail: ['account', 'update-weekly-summary-email'] as const,
    sendWeeklySummaryEmail:   ['account', 'send-weekly-summary-email']   as const,
  },
  trip: {
    create: ['trip', 'create'] as const,
    update: ['trip', 'update'] as const,
    delete: ['trip', 'delete'] as const,
  },
} as const
