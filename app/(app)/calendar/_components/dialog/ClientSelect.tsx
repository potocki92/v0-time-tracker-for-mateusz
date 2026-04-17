import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Client } from '@/lib/types'
import { stringToColor } from '../grid/clientColor'

interface Props {
  clients: Client[]
  value: string
  onChange: (value: string) => void
}

export function ClientSelect({ clients, value, onChange }: Props) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Klient
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-10 sm:h-9">
          <SelectValue placeholder="Wybierz klienta…" />
        </SelectTrigger>
        <SelectContent>
          {clients.map((client) => (
            <SelectItem key={client.id} value={client.id}>
              <span className="flex items-center gap-2">
                <span
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white"
                  style={{ background: stringToColor(client.name) }}
                >
                  {client.name.slice(0, 2).toUpperCase()}
                </span>
                <span>{client.name}</span>
                <span className="text-xs text-muted-foreground">
                  {client.rate} {client.currency}/{client.work_type === 'hourly' ? 'h' : client.unit}
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
