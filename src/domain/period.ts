import { addDays, addMonths, addWeeks, addYears, differenceInCalendarDays, startOfDay, startOfMonth, startOfWeek, startOfYear } from 'date-fns'

import { inZone, now as currentTime, WEEK_STARTS_ON } from '@/domain/calendar'
import { FUELS, fuelInfo, type FuelType } from '@/domain/enums'

// Dashboard filters (PeriodFilter, FuelFilter and DateRange in DashboardCalculator.swift).

/** Half-open range [start, end). */
export type DateRange = { start: Date; end: Date }

export function rangeContains(range: DateRange, date: Date): boolean {
  return date >= range.start && date < range.end
}

/** Range of the same length immediately before this one. */
export function previousRange(range: DateRange): DateRange {
  const length = range.end.getTime() - range.start.getTime()
  return { start: new Date(range.start.getTime() - length), end: range.start }
}

export function rangeDayCount(range: DateRange): number {
  return differenceInCalendarDays(inZone(range.end), inZone(range.start))
}

// MARK: Period

export const PERIOD_FILTERS = ['today', 'week', 'month', 'year', 'custom'] as const
export type PeriodFilter = (typeof PERIOD_FILTERS)[number]

export const periodTitle: Record<PeriodFilter, string> = {
  today: 'Hoy',
  week: 'Semana',
  month: 'Mes',
  year: 'Año',
  custom: 'Rango',
}

/** Periods without a custom range (used by the station detail). */
export const SIMPLE_PERIODS: readonly PeriodFilter[] = ['today', 'week', 'month', 'year']

export function periodRange(
  period: PeriodFilter,
  options: { customStart?: Date; customEnd?: Date; now?: Date } = {},
): DateRange {
  const now = inZone(options.now ?? currentTime())
  switch (period) {
    case 'today': {
      const start = startOfDay(now)
      return { start, end: addDays(start, 1) }
    }
    case 'week': {
      const start = startOfWeek(now, { weekStartsOn: WEEK_STARTS_ON })
      return { start, end: addWeeks(start, 1) }
    }
    case 'month': {
      const start = startOfMonth(now)
      return { start, end: addMonths(start, 1) }
    }
    case 'year': {
      const start = startOfYear(now)
      return { start, end: addYears(start, 1) }
    }
    case 'custom': {
      const first = startOfDay(inZone(options.customStart ?? now))
      const last = startOfDay(inZone(options.customEnd ?? now))
      const [start, lastDay] = first <= last ? [first, last] : [last, first]
      return { start, end: addDays(lastDay, 1) }
    }
  }
}

// MARK: Fuel

export const FUEL_FILTERS = ['all', 'diesel', 'regular', 'premium'] as const
export type FuelFilter = (typeof FUEL_FILTERS)[number]

export function fuelFilterTitle(filter: FuelFilter): string {
  return filter === 'all' ? 'Todos' : fuelInfo[filter].displayName
}

export function fuelFilterFuels(filter: FuelFilter): FuelType[] {
  return filter === 'all' ? [...FUELS] : [filter]
}
