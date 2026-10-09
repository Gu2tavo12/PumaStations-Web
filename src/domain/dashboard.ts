import { addDays, addHours, addMonths, endOfWeek, startOfDay, startOfMonth } from 'date-fns'

import { inZone, WEEK_STARTS_ON } from '@/domain/calendar'
import { closedCuts, gallonsLost, gallonsSold, lossAmount, purchaseAmount, referenceDate, salesAmount } from '@/domain/cut'
import { FUELS, type FuelRecord, type FuelType } from '@/domain/enums'
import type { Branch } from '@/domain/models'
import { previousRange, rangeContains, rangeDayCount, type DateRange } from '@/domain/period'
import { AppFormat } from '@/lib/format'

// Pure business logic: consolidates the closed cuts into dashboard metrics (DashboardCalculator.swift).

const emptyFuels = (): FuelRecord => ({ diesel: 0, regular: 0, premium: 0 })

export type BranchMetricRow = {
  id: string
  name: string
  gallons: FuelRecord
  sales: FuelRecord
  purchases: number
  lossGallons: number
  lossAmount: number
  closedCuts: number
  totalGallons: number
  totalSales: number
  /** Gross margin: sales − fuel purchases − valued losses. */
  margin: number
}

export type ChartBucket = {
  label: string
  start: Date
  end: Date
  sales: FuelRecord
}

export type DashboardMetrics = {
  rows: BranchMetricRow[]
  buckets: ChartBucket[]
  previousSales: number
  gallons: FuelRecord
  sales: FuelRecord
  totalGallons: number
  totalSales: number
  purchases: number
  lossGallons: number
  lossAmount: number
  margin: number
  closedCuts: number
  /** Relative change of sales against the previous period (null when not comparable). */
  salesChange: number | null
}

export const emptyMetrics: DashboardMetrics = summarize([], [], 0)

export function computeMetrics(branches: Branch[], range: DateRange, fuels: FuelType[] = [...FUELS]): DashboardMetrics {
  const buckets = makeBuckets(range)

  const rows = branches.map((branch) => {
    const gallons = emptyFuels()
    const sales = emptyFuels()
    let purchases = 0
    let lostGallons = 0
    let lostAmount = 0
    let cutCount = 0

    for (const cut of closedCuts(branch)) {
      const date = referenceDate(cut)
      if (!rangeContains(range, date)) continue
      cutCount += 1
      const bucket = buckets.find((candidate) => date >= candidate.start && date < candidate.end)
      for (const fuel of fuels) {
        const amount = salesAmount(cut, fuel)
        gallons[fuel] += gallonsSold(cut, fuel)
        sales[fuel] += amount
        purchases += purchaseAmount(cut, fuel)
        lostGallons += gallonsLost(cut, fuel)
        lostAmount += lossAmount(cut, fuel)
        if (bucket) bucket.sales[fuel] += amount
      }
    }

    const totalGallons = sum(Object.values(gallons))
    const totalSales = sum(Object.values(sales))
    return {
      id: branch.id,
      name: branch.name,
      gallons,
      sales,
      purchases,
      lossGallons: lostGallons,
      lossAmount: lostAmount,
      closedCuts: cutCount,
      totalGallons,
      totalSales,
      margin: totalSales - purchases - lostAmount,
    }
  })

  return summarize(rows, buckets, totalSalesOf(branches, previousRange(range), fuels))
}

function summarize(rows: BranchMetricRow[], buckets: ChartBucket[], previousSales: number): DashboardMetrics {
  const byFuel = (pick: (row: BranchMetricRow) => FuelRecord) => {
    const result = emptyFuels()
    for (const row of rows) for (const fuel of FUELS) result[fuel] += pick(row)[fuel]
    return result
  }
  const total = (pick: (row: BranchMetricRow) => number) => sum(rows.map(pick))
  const totalSales = total((row) => row.totalSales)

  return {
    rows,
    buckets,
    previousSales,
    gallons: byFuel((row) => row.gallons),
    sales: byFuel((row) => row.sales),
    totalGallons: total((row) => row.totalGallons),
    totalSales,
    purchases: total((row) => row.purchases),
    lossGallons: total((row) => row.lossGallons),
    lossAmount: total((row) => row.lossAmount),
    margin: total((row) => row.margin),
    closedCuts: total((row) => row.closedCuts),
    salesChange: previousSales > 0 ? (totalSales - previousSales) / previousSales : null,
  }
}

/** Sales of the closed cuts of the branches in the range. */
export function totalSalesOf(branches: Branch[], range: DateRange, fuels: FuelType[] = [...FUELS]): number {
  let total = 0
  for (const branch of branches) {
    for (const cut of closedCuts(branch)) {
      if (!rangeContains(range, referenceDate(cut))) continue
      for (const fuel of fuels) total += salesAmount(cut, fuel)
    }
  }
  return total
}

// MARK: Chart buckets

type Granularity = 'cut' | 'day' | 'week' | 'month'

/** Splits the range in chart buckets: per cut (≤ 1 day), day (≤ 8), week (≤ 62) or month. */
export function makeBuckets(range: DateRange): ChartBucket[] {
  const days = rangeDayCount(range)
  const granularity: Granularity = days <= 1 ? 'cut' : days <= 8 ? 'day' : days <= 62 ? 'week' : 'month'

  const result: ChartBucket[] = []
  let cursor = inZone(range.start)
  let index = 0

  while (cursor < range.end && index < 60) {
    let next: Date
    switch (granularity) {
      case 'cut':
        // Morning cut (reference 10:00) before 14:00, evening cut after.
        next = addHours(cursor, index === 0 ? 14 : 10)
        break
      case 'day':
        next = addDays(cursor, 1)
        break
      case 'week':
        next = addDays(startOfDay(endOfWeek(cursor, { weekStartsOn: WEEK_STARTS_ON })), 1)
        break
      case 'month':
        next = addMonths(startOfMonth(cursor), 1)
        break
    }
    const end = next < range.end ? next : range.end
    if (end <= cursor) break

    const label =
      granularity === 'cut'
        ? index === 0
          ? 'Matutino'
          : 'Vespertino'
        : granularity === 'day'
          ? AppFormat.date(cursor, 'EEE d')
          : granularity === 'week'
            ? `Sem ${index + 1}`
            : AppFormat.date(cursor, 'MMM')

    result.push({ label, start: cursor, end, sales: emptyFuels() })
    cursor = inZone(end)
    index += 1
  }
  return result
}


function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0)
}
