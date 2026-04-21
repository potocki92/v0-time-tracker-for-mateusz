'use client'

import { useFormContext, useWatch } from 'react-hook-form'

import { FormInput } from '@/components/common/form'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { CLIENT_COLORS } from '../../_domain/clients.constants'
import type { ClientFormValues } from '../../_domain/clientForm.schema'

export function ClientFormFields({ isEditMode }: { isEditMode: boolean }) {
  const { setValue, control } = useFormContext<ClientFormValues>()
  const workType = useWatch({ control, name: 'work_type' })
  const currency = useWatch({ control, name: 'currency' })
  const color = useWatch({ control, name: 'color' })
  const isDefault = useWatch({ control, name: 'is_default' })

  return (
    <div className="space-y-4">
      <FormInput<ClientFormValues>
        name="name"
        label="Nazwa *"
        placeholder="Nazwa firmy lub klienta"
      />

      <div className="grid grid-cols-2 gap-4">
        <FormInput<ClientFormValues>
          name="nip"
          label="NIP"
          placeholder="1234567890"
        />
        <FormInput<ClientFormValues>
          name="regon"
          label="REGON"
          placeholder="123456789"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Typ pracy *</Label>
          <Select
            value={workType}
            onValueChange={(value) =>
              setValue('work_type', value as ClientFormValues['work_type'], {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hourly">Godzinowa</SelectItem>
              <SelectItem value="piecework">Akordowa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Waluta *</Label>
          <Select
            value={currency}
            onValueChange={(value) =>
              setValue('currency', value as ClientFormValues['currency'], {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PLN">PLN</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <FormInput<ClientFormValues>
            name="rate"
            type="number"
            label="Aktualna stawka *"
            inputClassName="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          {isEditMode ? (
            <p className="text-xs text-muted-foreground">
              Edycja nadpisuje aktualną stawkę. Aby dodać nową stawkę obowiązującą od daty
              (bez utraty historii) — użyj przycisku „Historia stawek”.
            </p>
          ) : null}
        </div>

        {workType === 'piecework' ? (
          <FormInput<ClientFormValues>
            name="unit"
            label="Jednostka *"
            placeholder="kW, szt, m2..."
          />
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormInput<ClientFormValues>
          name="email"
          type="email"
          label="Email"
          autoComplete="email"
        />
        <FormInput<ClientFormValues>
          name="phone"
          label="Telefon"
          autoComplete="tel"
        />
      </div>

      <div className="space-y-2">
        <Label>Kolor</Label>
        <div className="flex flex-wrap gap-2">
          {CLIENT_COLORS.map((colorOption) => (
            <button
              key={colorOption}
              type="button"
              aria-label={`Kolor ${colorOption}`}
              aria-pressed={color === colorOption}
              className={`h-8 w-8 rounded-full border-2 transition-transform ${
                color === colorOption
                  ? 'scale-110 border-foreground'
                  : 'border-transparent'
              }`}
              style={{ backgroundColor: colorOption }}
              onClick={() =>
                setValue('color', colorOption, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="client-default">Ustaw jako domyślnego klienta</Label>
        <Switch
          id="client-default"
          checked={isDefault}
          onCheckedChange={(value) =>
            setValue('is_default', value, {
              shouldDirty: true,
            })
          }
        />
      </div>
    </div>
  )
}
