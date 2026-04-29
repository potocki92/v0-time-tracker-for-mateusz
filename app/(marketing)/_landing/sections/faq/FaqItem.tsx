import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

interface FaqItemProps {
  index: number
  question: string
  answer: string
}

export function FaqItem({ index, question, answer }: FaqItemProps) {
  return (
    <AccordionItem value={`item-${index}`}>
      <AccordionTrigger className="text-left text-base font-medium">{question}</AccordionTrigger>
      <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
        {answer}
      </AccordionContent>
    </AccordionItem>
  )
}
