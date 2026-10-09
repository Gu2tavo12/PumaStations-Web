import { subDays } from 'date-fns'
import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'

import { dayString, now, parseDay } from '@/domain/calendar'
import { FUEL_FILTERS, PERIOD_FILTERS, periodRange, type DateRange, type FuelFilter, type PeriodFilter } from '@/domain/period'
import { AppFormat, capitalize } from '@/lib/format'

/** Dashboard filters (GeneralDashboardViewModel), kept in the URL so a filtered view can be shared or reloaded. */
export type DashboardFilters = {
  /** Selected branch id; null = the whole country (consolidated). */
  branchId: string | null
  period: PeriodFilter
  fuel: FuelFilter
  /** `yyyy-MM-dd`, only used by the custom period. */
  from: string
  to: string
}

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function isOneOf<T extends string>(values: readonly T[], value: string | null): value is T {
  return value !== null && (values as readonly string[]).includes(value)
}

export function defaultCustomDays() {
  const today = now()
  return { from: dayString(subDays(today, 30)), to: dayString(today) }
}

export function useDashboardFilters() {
  const [params, setParams] = useSearchParams()

  const filters = useMemo<DashboardFilters>(() => {
    const defaults = defaultCustomDays()
    const period = params.get('periodo')
    const fuel = params.get('combustible')
    const from = params.get('desde')
    const to = params.get('hasta')
    return {
      branchId: params.get('sucursal'),
      period: isOneOf(PERIOD_FILTERS, period) ? period : 'month',
      fuel: isOneOf(FUEL_FILTERS, fuel) ? fuel : 'all',
      from: from && DAY_PATTERN.test(from) ? from : defaults.from,
      to: to && DAY_PATTERN.test(to) ? to : defaults.to,
    }
  }, [params])

  const update = useCallback(
    (changes: Partial<DashboardFilters>) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current)
          const set = (key: string, value: string | null, fallback: string | null) => {
            if (value === null || value === fallback) next.delete(key)
            else next.set(key, value)
          }
          if ('branchId' in changes) set('sucursal', changes.branchId ?? null, null)
          if (changes.period) set('periodo', changes.period, 'month')
          if (changes.fuel) set('combustible', changes.fuel, 'all')
          if (changes.from) set('desde', changes.from, null)
          if (changes.to) set('hasta', changes.to, null)
          if (changes.period && changes.period !== 'custom') {
            next.delete('desde')
            next.delete('hasta')
          }
          return next
        },
        { replace: true },
      )
    },
    [setParams],
  )

  const reset = useCallback(() => setParams(new URLSearchParams(), { replace: true }), [setParams])

  return { filters, update, reset }
}

export function filtersRange(filters: DashboardFilters): DateRange {
  return periodRange(filters.period, { customStart: parseDay(filters.from), customEnd: parseDay(filters.to) })
}

export function periodLabel(filters: DashboardFilters): string {
  switch (filters.period) {
    case 'today':
      return 'Hoy'
    case 'week':
      return 'Esta semana'
    case 'month':
      return capitalize(AppFormat.date(now(), 'MMMM yyyy'))
    case 'year':
      return AppFormat.date(now(), 'yyyy')
    case 'custom': {
      const [start, end] = [filters.from, filters.to].sort()
      return `${AppFormat.date(parseDay(start), 'd MMM')} – ${AppFormat.date(parseDay(end), 'd MMM')}`
    }
  }
}
