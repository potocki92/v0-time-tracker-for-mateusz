import { Button } from "@/components/ui/button"
import { useOpenModal } from "@/hooks/stores/useUiStore"

export function NewInvoiceButton() {
  const open = useOpenModal()
  return <Button onClick={() => open('invoice-create')}>+ Nowa faktura</Button>
}