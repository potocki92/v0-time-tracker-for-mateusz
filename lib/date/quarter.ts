export function getQuarterFromDate(dateInput: string | number | Date): 1 | 2 | 3 | 4 {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput)
  const month = date.getMonth()
  return (Math.floor(month / 3) + 1) as 1 | 2 | 3 | 4
}

export function getQuarterLabel(dateInput: string | number | Date): string {
  return `Q${getQuarterFromDate(dateInput)}`
}

