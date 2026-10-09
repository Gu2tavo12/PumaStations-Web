import { describe, expect, it } from 'vitest'

/** Instant in UTC (TZDate.toISOString keeps the -06:00 offset). */
const utc = (date: Date) => new Date(date.getTime()).toISOString()

import { computeMetrics, makeBuckets } from '@/domain/dashboard'
import { periodRange, previousRange, rangeDayCount } from '@/domain/period'
import { branch, cut, fuels, loss, reception, sixPumps } from '@/domain/test-fixtures'

// "Now": Thursday 8 Oct 2026, 15:00 in El Salvador.
const NOW = new Date('2026-10-08T21:00:00Z')

describe('periodRange', () => {
  it('today goes from 00:00 to 24:00 in El Salvador', () => {
    const range = periodRange('today', { now: NOW })
    expect(utc(range.start)).toBe('2026-10-08T06:00:00.000Z')
    expect(utc(range.end)).toBe('2026-10-09T06:00:00.000Z')
  })

  it('weeks start on Monday', () => {
    const range = periodRange('week', { now: NOW })
    expect(utc(range.start)).toBe('2026-10-05T06:00:00.000Z')
    expect(rangeDayCount(range)).toBe(7)
  })

  it('month and year cover the calendar month and year', () => {
    const month = periodRange('month', { now: NOW })
    expect(utc(month.start)).toBe('2026-10-01T06:00:00.000Z')
    expect(utc(month.end)).toBe('2026-11-01T06:00:00.000Z')
    expect(rangeDayCount(periodRange('year', { now: NOW }))).toBe(365)
  })

  it('custom ranges include the last day and accept swapped dates', () => {
    const range = periodRange('custom', {
      customStart: new Date('2026-10-10T20:00:00Z'),
      customEnd: new Date('2026-10-01T20:00:00Z'),
    })
    expect(utc(range.start)).toBe('2026-10-01T06:00:00.000Z')
    expect(utc(range.end)).toBe('2026-10-11T06:00:00.000Z')
  })

  it('the previous range has the same length', () => {
    const previous = previousRange(periodRange('week', { now: NOW }))
    expect(utc(previous.start)).toBe('2026-09-28T06:00:00.000Z')
    expect(utc(previous.end)).toBe('2026-10-05T06:00:00.000Z')
  })
})

describe('makeBuckets', () => {
  it('splits one day into morning and evening cuts', () => {
    expect(makeBuckets(periodRange('today', { now: NOW })).map((bucket) => bucket.label)).toEqual(['Matutino', 'Vespertino'])
  })

  it('splits a week into days', () => {
    const labels = makeBuckets(periodRange('week', { now: NOW })).map((bucket) => bucket.label)
    expect(labels).toHaveLength(7)
    expect(labels[0]).toBe('lun 5')
  })

  it('splits a month into calendar weeks (Monday to Sunday)', () => {
    const buckets = makeBuckets(periodRange('month', { now: NOW }))
    // October 2026: 1–4, 5–11, 12–18, 19–25, 26–31.
    expect(buckets.map((bucket) => bucket.label)).toEqual(['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5'])
    expect(utc(buckets[1].start)).toBe('2026-10-05T06:00:00.000Z')
    expect(utc(buckets[4].end)).toBe('2026-11-01T06:00:00.000Z')
  })

  it('splits a year into months', () => {
    const buckets = makeBuckets(periodRange('year', { now: NOW }))
    expect(buckets).toHaveLength(12)
    expect(buckets[0].label).toBe('ene')
  })
})

describe('computeMetrics', () => {
  const price = fuels(3.84, 3.88, 4.19)
  const station = branch('Puma Escalón', {
    cuts: [
      // Last week (previous period): $ 6 × 10 × 3.88 = 232.80 of Regular.
      cut('2026-10-01', 1, { pumpSales: sixPumps(fuels(0, 10, 0), price) }),
      // This week.
      cut('2026-10-06', 1, {
        pumpSales: sixPumps(fuels(10, 20, 5), price),
        receptions: [reception('regular', 1_000, 2.95)],
        losses: [loss('premium', 10, 3.31, 4)],
      }),
      cut('2026-10-06', 2, { pumpSales: sixPumps(fuels(10, 20, 5), price) }),
      // Open cut: never counts.
      cut('2026-10-08', 2, { status: 'open', pumpSales: sixPumps(fuels(999, 999, 999), price) }),
    ],
  })
  const range = periodRange('week', { now: NOW })

  it('consolidates only the closed cuts of the period', () => {
    const metrics = computeMetrics([station], range)
    expect(metrics.closedCuts).toBe(2)
    expect(metrics.gallons).toEqual({ diesel: 120, regular: 240, premium: 60 })
    expect(metrics.totalSales).toBeCloseTo(120 * 3.84 + 240 * 3.88 + 60 * 4.19, 6)
    expect(metrics.purchases).toBeCloseTo(2_950, 6)
    expect(metrics.lossGallons).toBe(10)
    expect(metrics.margin).toBeCloseTo(metrics.totalSales - 2_950 - 33.1, 6)
  })

  it('compares the sales with the previous period', () => {
    const metrics = computeMetrics([station], range)
    expect(metrics.previousSales).toBeCloseTo(232.8, 6)
    expect(metrics.salesChange).toBeCloseTo((metrics.totalSales - 232.8) / 232.8, 6)
  })

  it('puts each cut in its day bucket', () => {
    const metrics = computeMetrics([station], range)
    const tuesday = metrics.buckets[1]
    expect(tuesday.label).toBe('mar 6')
    expect(tuesday.sales.regular).toBeCloseTo(240 * 3.88, 6)
    expect(metrics.buckets[0].sales.regular).toBe(0)
  })

  it('filters by fuel (purchases and losses included)', () => {
    const metrics = computeMetrics([station], range, ['premium'])
    expect(metrics.gallons).toEqual({ diesel: 0, regular: 0, premium: 60 })
    expect(metrics.purchases).toBe(0)
    expect(metrics.lossGallons).toBe(10)
    expect(metrics.salesChange).toBeNull()
  })
})
