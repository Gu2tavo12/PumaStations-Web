import { describe, expect, it } from 'vitest'

/** Instant in UTC (TZDate.toISOString keeps the -06:00 offset). */
const utc = (date: Date) => new Date(date.getTime()).toISOString()

import { parseDay } from '@/domain/calendar'
import { evaluateTankStatus, worstOf } from '@/domain/enums'
import { dailyAverage, makeTankLevel, mainAlert, projectedStock, tankAlerts, tankLevels } from '@/domain/inventory'
import { branch, cut, fuels, history, loss, reception, sixPumps } from '@/domain/test-fixtures'

// "Now": Thursday 8 Oct 2026, 15:00 in El Salvador.
const NOW = new Date('2026-10-08T21:00:00Z')

describe('evaluateTankStatus', () => {
  it('is critical below 20 % or below 1.5 days', () => {
    expect(evaluateTankStatus(0.19, null)).toBe('critical')
    expect(evaluateTankStatus(0.9, 1.4)).toBe('critical')
  })

  it('is medium below 40 % or below 3 days', () => {
    expect(evaluateTankStatus(0.2, null)).toBe('medium')
    expect(evaluateTankStatus(0.39, 10)).toBe('medium')
    expect(evaluateTankStatus(0.9, 2.9)).toBe('medium')
  })

  it('is optimal otherwise, including when there are no recent sales', () => {
    expect(evaluateTankStatus(0.4, 3)).toBe('optimal')
    expect(evaluateTankStatus(1, null)).toBe('optimal')
  })

  it('picks the worst status', () => {
    expect(worstOf(['optimal', 'medium', 'optimal'])).toBe('medium')
    expect(worstOf(['medium', 'critical'])).toBe('critical')
    expect(worstOf([])).toBe('optimal')
  })
})

describe('makeTankLevel', () => {
  it('matches the Soyapango Súper tank of the seed (critical, order to 85 %)', () => {
    const tank = makeTankLevel('premium', 820, 6_000, 0)
    expect(tank.ratio).toBeCloseTo(0.1367, 4)
    expect(tank.daysLeft).toBeNull()
    expect(tank.status).toBe('critical')
    // 6000 × 0.85 − 820 = 4280 → rounded down to 500 gal.
    expect(tank.suggestedOrder).toBe(4_000)
  })

  it('computes days left from the daily average', () => {
    const tank = makeTankLevel('regular', 3_000, 10_000, 1_200)
    expect(tank.daysLeft).toBe(2.5)
    expect(tank.status).toBe('medium')
  })

  it('clamps the ratio and suggests nothing for a full tank', () => {
    const tank = makeTankLevel('diesel', 12_000, 10_000, 100)
    expect(tank.ratio).toBe(1)
    expect(tank.suggestedOrder).toBe(0)
  })
})

describe('dailyAverage', () => {
  it('averages the closed cuts of the 7 days before today, excluding today and open cuts', () => {
    const cuts = [
      // 10 days of history; only the last 7 count. 6 pumps × 10 gal × 2 cuts = 120 gal/day.
      ...history('2026-10-08', 10, fuels(10, 10, 10)),
      // Today: does not count.
      cut('2026-10-08', 1, { pumpSales: sixPumps(fuels(500, 500, 500)) }),
      cut('2026-10-08', 2, { status: 'open', pumpSales: sixPumps(fuels(500, 500, 500)) }),
    ]
    const station = branch('Puma Escalón', { cuts })
    expect(dailyAverage(station, 'regular', NOW)).toBe(120)
  })

  it('does not count open cuts inside the window', () => {
    const station = branch('Puma Escalón', {
      cuts: [cut('2026-10-07', 1, { status: 'open', pumpSales: sixPumps(fuels(70, 70, 70)) })],
    })
    expect(dailyAverage(station, 'diesel', NOW)).toBe(0)
  })
})

describe('tankAlerts', () => {
  it('lists the non-optimal tanks, most urgent first', () => {
    const daily = fuels(10, 10, 10) // 120 gal/day per fuel
    const escalon = branch('Puma Escalón', {
      capacity: fuels(10_000, 12_000, 8_000),
      stock: fuels(3_500, 2_150, 5_480), // 35 % medium, 17.9 % critical, 68.5 % optimal
      cuts: history('2026-10-08', 7, daily),
    })
    const soyapango = branch('Puma Soyapango', {
      capacity: fuels(8_000, 10_000, 6_000),
      stock: fuels(5_100, 6_300, 150), // Súper: 2.5 % and 1.25 days → critical
      cuts: history('2026-10-08', 7, daily),
    })

    const alerts = tankAlerts([escalon, soyapango], NOW)
    expect(alerts.map((alert) => `${alert.branchName} ${alert.tank.fuel} ${alert.tank.status}`)).toEqual([
      'Puma Soyapango premium critical',
      'Puma Escalón regular critical',
      'Puma Escalón diesel medium',
    ])
    expect(mainAlert(tankLevels(escalon, NOW))?.fuel).toBe('regular')
  })
})

describe('projectedStock', () => {
  it('applies the movements of the open cut: + received − sold − lost', () => {
    const open = cut('2026-10-08', 2, {
      status: 'open',
      pumpSales: sixPumps(fuels(0, 100, 0)),
      receptions: [reception('regular', 1_000, 2.95)],
      losses: [loss('regular', 12, 2.95)],
    })
    const station = branch('Puma Escalón', { stock: fuels(0, 2_000, 0), cuts: [open] })
    expect(projectedStock(station, 'regular', open)).toBe(2_000 + 1_000 - 600 - 12)
    expect(projectedStock(station, 'regular', undefined)).toBe(2_000)
  })

  it('parses days at midnight in El Salvador', () => {
    expect(utc(parseDay('2026-10-08'))).toBe('2026-10-08T06:00:00.000Z')
  })
})
