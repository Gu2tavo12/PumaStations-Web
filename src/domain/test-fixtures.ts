import { subDays } from 'date-fns'

import { parseDay, dayString } from '@/domain/calendar'
import type { CutShift, FuelRecord } from '@/domain/enums'
import type { Branch, FuelLoss, FuelReception, PumpSale, SalesCut } from '@/domain/models'

// Small builders for the domain tests (not used by the app).

let nextId = 0
const id = (prefix: string) => `${prefix}-${++nextId}`

export const fuels = (diesel: number, regular: number, premium: number): FuelRecord => ({ diesel, regular, premium })

export function pumpSale(pumpNumber: number, gallons: FuelRecord, price = fuels(4, 4, 4)): PumpSale {
  return {
    id: id('sale'),
    pumpNumber,
    isOutOfService: false,
    gallons,
    amount: fuels(gallons.diesel * price.diesel, gallons.regular * price.regular, gallons.premium * price.premium),
    recordedAt: parseDay('2026-01-01'),
  }
}

/** Six pumps that each sell the given gallons (so the cut sells 6×). */
export function sixPumps(gallons: FuelRecord, price?: FuelRecord): PumpSale[] {
  return [1, 2, 3, 4, 5, 6].map((number) => pumpSale(number, gallons, price))
}

export function cut(
  day: string,
  shift: CutShift,
  options: Partial<Pick<SalesCut, 'status' | 'pumpSales' | 'receptions' | 'losses'>> = {},
): SalesCut {
  const date = parseDay(day)
  return {
    id: id('cut'),
    branchId: 'branch',
    day: date,
    shift,
    status: options.status ?? 'closed',
    openedAt: date,
    closedAt: options.status === 'open' ? null : date,
    opening: fuels(0, 0, 0),
    pumpSales: options.pumpSales ?? sixPumps(fuels(10, 10, 10)),
    receptions: options.receptions ?? [],
    losses: options.losses ?? [],
  }
}

export function reception(fuel: FuelReception['fuel'], gallons: number, costPerGallon: number): FuelReception {
  return {
    id: id('reception'),
    fuel,
    gallons,
    costPerGallon,
    supplier: 'Puma Energy El Salvador',
    invoiceNumber: 'F-1',
    receivedAt: parseDay('2026-01-01'),
  }
}

export function loss(fuel: FuelLoss['fuel'], gallons: number, costPerGallon: number, pumpNumber: number | null = null): FuelLoss {
  return {
    id: id('loss'),
    type: 'shrinkage',
    fuel,
    gallons,
    costPerGallon,
    pumpNumber,
    details: '',
    recordedAt: parseDay('2026-01-01'),
  }
}

export function branch(name: string, options: Partial<Pick<Branch, 'capacity' | 'stock' | 'cuts'>> = {}): Branch {
  return {
    id: id('branch'),
    name,
    code: 'SUC-000',
    address: '',
    municipality: '',
    phone: '',
    createdAt: parseDay('2026-01-01'),
    capacity: options.capacity ?? fuels(10_000, 12_000, 8_000),
    stock: options.stock ?? fuels(7_500, 9_000, 6_000),
    pumps: [1, 2, 3, 4, 5, 6].map((number) => ({ id: id('pump'), number })),
    cuts: options.cuts ?? [],
  }
}

/** Both cuts of each of the `count` days before `today` (closed, 6 pumps). */
export function history(today: string, count: number, perPump: FuelRecord): SalesCut[] {
  const cuts: SalesCut[] = []
  for (let offset = count; offset >= 1; offset--) {
    const day = dayString(subDays(parseDay(today), offset))
    cuts.push(cut(day, 1, { pumpSales: sixPumps(perPump) }), cut(day, 2, { pumpSales: sixPumps(perPump) }))
  }
  return cuts
}
