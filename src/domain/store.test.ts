import { describe, expect, it } from 'vitest'

import { inZone, parseDay } from '@/domain/calendar'
import { evaluateStockStatus, type CatalogCategory } from '@/domain/enums'
import type { CatalogItem, Sale, StockEntry, UserAccount, WorkShift } from '@/domain/models'
import {
  computeStoreMetrics,
  employeesOf,
  isCatalogNameTaken,
  isOnShift,
  stockAlerts,
  stockLevels,
  storeSalesTotal,
} from '@/domain/store'

// "Now": Thursday 8 Oct 2026, 15:00 in El Salvador.
const NOW = new Date('2026-10-08T21:00:00Z')

let nextId = 0
const id = (prefix: string) => `${prefix}-${++nextId}`

function item(name: string, category: CatalogCategory, price: number, minStock = 0, isActive = true): CatalogItem {
  return { id: id('item'), name, category, detail: '', price, minStock, isActive, createdAt: parseDay('2026-01-01') }
}

function entry(target: CatalogItem, quantity: number): StockEntry {
  return { id: id('entry'), branchId: 'b1', itemId: target.id, quantity, unitCost: 0, note: '', receivedAt: parseDay('2026-10-01') }
}

function sale(soldAt: string, lines: [CatalogItem, number][], sellerId: string | null = 'u1'): Sale {
  return {
    id: id('sale'),
    branchId: 'b1',
    sellerId,
    kind: lines.some(([target]) => target.category === 'service') ? 'service' : 'store',
    payment: 'cash',
    vehiclePlate: '',
    soldAt: inZone(soldAt),
    items: lines.map(([target, quantity]) => ({ id: id('line'), item: target, quantity, unitPrice: target.price })),
  }
}

function user(userId: string, firstName: string, role: UserAccount['role'], branchId: string | null): UserAccount {
  return {
    id: userId,
    firstName,
    lastName: 'Prueba',
    email: `${userId}@puma.sv`,
    role,
    dui: '',
    phone: '',
    isActive: true,
    createdAt: parseDay('2026-01-01'),
    branchId,
    jobTitle: '',
  }
}

const water = item('Agua', 'convenience', 1, 5)
const oil = item('Aceite', 'lubricant', 8, 3)
const chips = item('Papas', 'convenience', 1.5, 4)
const retired = item('Descontinuado', 'convenience', 2, 2, false)
const oilChange = item('Cambio de aceite', 'service', 25)

describe('evaluateStockStatus', () => {
  it('is out without stock, low at or below the minimum and available otherwise', () => {
    expect(evaluateStockStatus(0, 5)).toBe('out')
    expect(evaluateStockStatus(-1, 5)).toBe('out')
    expect(evaluateStockStatus(5, 5)).toBe('low')
    expect(evaluateStockStatus(6, 5)).toBe('available')
  })
})

describe('stockLevels', () => {
  const sales = [sale('2026-10-05T15:00:00Z', [[water, 7], [oilChange, 1]]), sale('2026-10-06T15:00:00Z', [[oil, 2]])]
  const levels = stockLevels([water, oil, chips, retired, oilChange], [entry(water, 12), entry(oil, 4)], sales)

  it('is entries minus units sold, without services or inactive items without entries', () => {
    expect(levels.map((level) => [level.item.name, level.received, level.sold, level.available])).toEqual([
      ['Agua', 12, 7, 5],
      ['Aceite', 4, 2, 2],
      ['Papas', 0, 0, 0],
    ])
  })

  it('lists the products to restock, the most urgent first', () => {
    expect(stockAlerts(levels).map((level) => [level.item.name, level.status])).toEqual([
      ['Papas', 'out'],
      ['Aceite', 'low'],
      ['Agua', 'low'],
    ])
  })

  it('keeps an inactive product with entries but does not alert it', () => {
    const withRetired = stockLevels([retired], [entry(retired, 1)], [])
    expect(withRetired).toHaveLength(1)
    expect(stockAlerts(withRetired)).toEqual([])
  })
})

describe('computeStoreMetrics', () => {
  const week = { start: parseDay('2026-10-05'), end: parseDay('2026-10-12') }
  const users = [user('u1', 'Mario', 'employee', 'b1'), user('u2', 'Sofía', 'employee', 'b1')]
  const sales = [
    sale('2026-10-06T15:00:00Z', [[water, 2], [oil, 1]], 'u1'),
    sale('2026-10-07T15:00:00Z', [[oilChange, 1]], 'u2'),
    sale('2026-10-08T15:00:00Z', [[water, 1]], null),
    // Previous week.
    sale('2026-09-30T15:00:00Z', [[oilChange, 2]], 'u2'),
    // Outside both ranges.
    sale('2026-09-01T15:00:00Z', [[oil, 10]], 'u1'),
  ]
  const metrics = computeStoreMetrics(sales, week, users)

  it('adds the sales of the period by category', () => {
    expect(metrics.tickets).toBe(3)
    expect(metrics.categories).toEqual([
      { category: 'convenience', units: 3, amount: 3 },
      { category: 'lubricant', units: 1, amount: 8 },
      { category: 'service', units: 1, amount: 25 },
    ])
    expect(metrics.storeTotal).toBe(11)
    expect(metrics.serviceTotal).toBe(25)
    expect(metrics.total).toBe(36)
    expect(metrics.averageTicket).toBe(12)
  })

  it('ranks the items and the sellers', () => {
    expect(metrics.topItems.map((row) => [row.name, row.units])).toEqual([
      ['Cambio de aceite', 1],
      ['Aceite', 1],
      ['Agua', 3],
    ])
    expect(metrics.sellers.map((row) => [row.name, row.tickets, row.amount])).toEqual([
      ['Sofía Prueba', 1, 25],
      ['Mario Prueba', 1, 10],
    ])
  })

  it('compares with the previous period of the same length', () => {
    expect(metrics.previousTotal).toBe(50)
    expect(metrics.change).toBeCloseTo(-0.28, 6)
    expect(storeSalesTotal(sales, week)).toBe(36)
    expect(computeStoreMetrics([], week).change).toBeNull()
  })
})

describe('staff', () => {
  it('lists only the employees of the branch', () => {
    const users = [user('m1', 'Ana', 'branchManager', 'b1'), user('e1', 'Beto', 'employee', 'b1'), user('e2', 'Carla', 'employee', 'b2')]
    expect(employeesOf('b1', users).map((employee) => employee.id)).toEqual(['e1'])
  })

  it('counts a shift as in progress only today, checked in and not out', () => {
    const shift = (day: string, checkIn: string | null, checkOut: string | null = null): WorkShift => ({
      id: id('shift'),
      branchId: 'b1',
      employeeId: 'e1',
      day: parseDay(day),
      shift: 1,
      checkInAt: checkIn ? inZone(checkIn) : null,
      checkOutAt: checkOut ? inZone(checkOut) : null,
    })
    expect(isOnShift(shift('2026-10-08', '2026-10-08T12:00:00Z'), NOW)).toBe(true)
    expect(isOnShift(shift('2026-10-08', null), NOW)).toBe(false)
    expect(isOnShift(shift('2026-10-08', '2026-10-08T12:00:00Z', '2026-10-08T20:00:00Z'), NOW)).toBe(false)
    expect(isOnShift(shift('2026-10-07', '2026-10-07T12:00:00Z'), NOW)).toBe(false)
  })
})

describe('isCatalogNameTaken', () => {
  it('ignores case, spaces and the item being edited', () => {
    expect(isCatalogNameTaken([water, oil], '  agua ')).toBe(true)
    expect(isCatalogNameTaken([water, oil], 'Agua', water.id)).toBe(false)
    expect(isCatalogNameTaken([water, oil], 'Café')).toBe(false)
  })
})
