import { format as formatDate } from 'date-fns'
import { es } from 'date-fns/locale'

import { inZone } from '@/domain/calendar'

// Same output as AppFormat in iOS: US number format, Spanish dates.

const currency0 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0, minimumFractionDigits: 0 })
const currency2 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })
const number02 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })
const number01 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 })
const percent01 = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 })

export const AppFormat = {
  currency(value: number, decimals = false): string {
    return (decimals ? currency2 : currency0).format(value)
  },

  compactCurrency(value: number): string {
    if (Math.abs(value) >= 1_000) return `$${number01.format(value / 1_000)}k`
    return AppFormat.currency(value)
  },

  number(value: number): string {
    return number02.format(value)
  },

  gallons(value: number): string {
    return `${AppFormat.number(value)} gal`
  },

  percent(value: number): string {
    return percent01.format(value)
  },

  /** date-fns pattern, e.g. `d MMM yyyy`, `EEE d MMM`, `MMMM yyyy`. */
  date(date: Date, pattern = 'd MMM yyyy'): string {
    return formatDate(inZone(date), pattern, { locale: es })
  },
}

export function capitalize(text: string): string {
  return text.charAt(0).toLocaleUpperCase('es') + text.slice(1)
}

/** Rounds to a number of decimal places (Double.rounded(toPlaces:)). */
export function roundTo(value: number, places: number): number {
  const factor = 10 ** places
  return Math.round(value * factor) / factor
}
