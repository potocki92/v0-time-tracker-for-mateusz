'use client'

import * as React from 'react'
import { useFormContext } from 'react-hook-form'
import { Check, ChevronsUpDown, UserPlus } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ClientDisplay } from '@/components/common/ClientDisplay'
import type { Client } from '@/lib/types'
import type { InvoiceBuilderValues } from '@/lib/schemas/invoice-builder.schema'

interface ClientPickerFieldProps {
  clients: Client[]
  selectedClientId: string | null
  onSelectedClientIdChange: (clientId: string | null) => void
}

/**
 * Single source of truth for the buyer–client link inside the builder.
 *
 * Picking a client copies its address-book fields (NIP, address, city, …)
 * into the form's `buyer.*` block via `setValue`, so the user immediately
 * sees the data they're invoicing against and can still tweak it before
 * saving. We mark the touched fields as dirty so the standard "save"
 * path (which also upserts client extras) kicks in if the user edits.
 */
export function ClientPickerField({
  clients,
  selectedClientId,
  onSelectedClientIdChange,
}: ClientPickerFieldProps) {
  const { setValue, getValues } = useFormContext<InvoiceBuilderValues>()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')

  const selectedClient = React.useMemo(
    () => clients.find((c) => c.id === selectedClientId) ?? null,
    [clients, selectedClientId],
  )

  const handleSelect = React.useCallback(
    (client: Client | null) => {
      onSelectedClientIdChange(client?.id ?? null)

      if (!client) {
        setOpen(false)
        return
      }

      const buyer = getValues('buyer')
      // Only overwrite fields that are empty so we don't clobber data the
      // user already typed. The buyer name follows the client name even if
      // it was previously set, because that's the most-edited field and
      // changing client implies "invoice this party instead".
      setValue('buyer.name', client.name ?? '', { shouldDirty: true, shouldTouch: true })
      if (!buyer.tax_id && client.nip) {
        setValue('buyer.tax_id', client.nip, { shouldDirty: true })
      }
      if (!buyer.address && client.address) {
        setValue('buyer.address', client.address, { shouldDirty: true })
      }
      if (!buyer.city && client.city) {
        setValue('buyer.city', client.city, { shouldDirty: true })
      }
      if (!buyer.postal_code && client.postal_code) {
        setValue('buyer.postal_code', client.postal_code, { shouldDirty: true })
      }
      if (!buyer.email && client.email) {
        setValue('buyer.email', client.email, { shouldDirty: true })
      }
      if (client.country_code) {
        setValue('buyer.country_code', client.country_code.toUpperCase(), {
          shouldDirty: true,
        })
      }

      setOpen(false)
    },
    [getValues, onSelectedClientIdChange, setValue],
  )

  const triggerLabel = selectedClient ? selectedClient.name : 'Wybierz klienta'

  return (
    <div className="grid gap-2">
      <Label>Klient</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="justify-between font-normal"
          >
            {selectedClient ? (
              <ClientDisplay
                client={selectedClient}
                variant="select-item"
                size="sm"
                className="min-w-0"
              />
            ) : (
              <span className="truncate text-muted-foreground">{triggerLabel}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0" align="start">
          <Command>
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder="Wyszukaj klienta..."
            />
            <CommandList>
              <CommandEmpty>Brak klientów pasujących do frazy.</CommandEmpty>
              <CommandGroup heading="Klienci">
                <CommandItem
                  value="bez-klienta"
                  onSelect={() => handleSelect(null)}
                >
                  <Check
                    className={cn('mr-2 h-4 w-4', !selectedClientId ? 'opacity-100' : 'opacity-0')}
                  />
                  <UserPlus className="mr-2 h-4 w-4 text-muted-foreground" aria-hidden />
                  Bez klienta — uzupełnij ręcznie
                </CommandItem>
                {clients.map((client) => (
                  <CommandItem
                    key={client.id}
                    value={client.name}
                    onSelect={() => handleSelect(client)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4 shrink-0',
                        selectedClientId === client.id ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <ClientDisplay client={client} variant="select-item" size="sm" />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selectedClient ? (
        <p className="text-xs text-muted-foreground">
          Dane nabywcy poniżej zostały wczytane z karty klienta i można je edytować
          przed zapisem.
        </p>
      ) : null}
    </div>
  )
}
