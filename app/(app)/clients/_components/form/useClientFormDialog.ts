'use client'

import { useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'

import type { Client, ClientFormData } from '@/lib/types'
import {
  clientFormSchema,
  EMPTY_CLIENT_FORM_VALUES,
  toClientFormValues,
  toClientMutationInput,
  type ClientFormValues,
} from '../../_domain/clientForm.schema'
import { CLIENT_COLORS } from '../../_domain/clients.constants'

function randomClientColor() {
  return CLIENT_COLORS[Math.floor(Math.random() * CLIENT_COLORS.length)]
}

export function useClientFormDialog(client: Client | null) {
  const defaultValues = useMemo<ClientFormValues>(() => {
    if (client) {
      return toClientFormValues(client)
    }

    return {
      ...EMPTY_CLIENT_FORM_VALUES,
      color: randomClientColor(),
    }
  }, [client])

  const resolver = useMemo(() => zodResolver(clientFormSchema), [])

  const handleSubmit = (values: ClientFormValues, onSubmit: (form: ClientFormData) => void) => {
    onSubmit(toClientMutationInput(values))
  }

  return {
    defaultValues,
    resolver,
    handleSubmit,
    isEditMode: Boolean(client),
    title: client ? 'Edytuj klienta' : 'Nowy klient',
  }
}
