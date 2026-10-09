import { describe, expect, it } from 'vitest'

import { cutOn, hasOperation, isReadyToClose, managerOf, netMovement, totalSales } from '@/domain/cut'
import { buildGraph, type PumaRows } from '@/domain/mapping'
import { AppFormat } from '@/lib/format'

const rows: PumaRows = {
  profiles: [
    {
      id: 'u2',
      first_name: 'Roberto',
      last_name: 'Martínez',
      email: 'rmartinez@puma.sv',
      role: 'branchManager',
      dui: '',
      phone: '',
      is_active: true,
      created_at: '2026-08-01T12:00:00+00:00',
      branch_id: 'b2',
      job_title: '',
    },
    {
      id: 'u3',
      first_name: 'Mario',
      last_name: 'Rivas',
      email: 'mrivas@puma.sv',
      role: 'employee',
      dui: '',
      phone: '',
      is_active: true,
      created_at: '2026-08-01T12:00:00+00:00',
      branch_id: 'b2',
      job_title: 'Pistero',
    },
    {
      id: 'u1',
      first_name: 'Elena',
      last_name: 'Guevara',
      email: 'gerente@puma.sv',
      role: 'generalManager',
      dui: '',
      phone: '',
      is_active: true,
      created_at: '2026-08-01T12:00:00+00:00',
      branch_id: null,
      job_title: '',
    },
  ],
  branches: ['b2', 'b1'].map((id) => ({
    id,
    name: id === 'b1' ? 'Puma Merliot' : 'Puma Escalón',
    code: 'SUC',
    address: '',
    municipality: '',
    phone: '',
    created_at: '2026-08-01T12:00:00+00:00',
    diesel_capacity: 10_000,
    regular_capacity: 12_000,
    premium_capacity: 8_000,
    diesel_stock: 3_500,
    regular_stock: 2_150,
    premium_stock: 5_480,
  })),
  pumps: [6, 2, 1, 3, 5, 4].map((number) => ({ id: `p${number}`, branch_id: 'b2', number })),
  sales_cuts: [
    { id: 'c2', branch_id: 'b2', day: '2026-10-08', shift: 2, status: 'open', opened_at: '2026-10-08T20:00:00.922997+00:00', closed_at: null, opening_diesel: 0, opening_regular: 0, opening_premium: 0 },
    { id: 'c1', branch_id: 'b2', day: '2026-10-08', shift: 1, status: 'closed', opened_at: '2026-10-08T12:00:00+00:00', closed_at: '2026-10-08T20:00:00+00:00', opening_diesel: 1, opening_regular: 2, opening_premium: 3 },
  ],
  pump_sales: [1, 2, 3, 4, 5, 6].map((number) => ({
    id: `s${number}`,
    cut_id: 'c1',
    pump_number: number,
    is_out_of_service: false,
    diesel_gallons: 10,
    diesel_amount: 38.4,
    regular_gallons: 10,
    regular_amount: 38.8,
    premium_gallons: 10,
    premium_amount: 41.9,
    recorded_at: '2026-10-08T16:00:00+00:00',
  })),
  fuel_receptions: [
    { id: 'r1', cut_id: 'c1', fuel: 'regular', gallons: 5_000, cost_per_gallon: 2.95, supplier: 'Puma', invoice_number: 'F-1', received_at: '2026-10-08T14:00:00+00:00' },
  ],
  fuel_losses: [
    { id: 'l1', cut_id: 'c2', type: 'shrinkage', fuel: 'regular', gallons: 12, cost_per_gallon: 2.95, pump_number: null, details: '', recorded_at: '2026-10-09T00:00:00+00:00' },
  ],
  work_shifts: [
    { id: 'w1', branch_id: 'b2', employee_id: 'u3', day: '2026-10-08', shift: 1, check_in_at: '2026-10-08T12:02:00+00:00', check_out_at: null, created_at: '2026-10-01T12:00:00+00:00' },
  ],
  catalog_items: [
    { id: 'i2', name: 'Cambio de aceite', category: 'service', detail: '', price: 25, min_stock: 0, is_active: true, created_at: '2026-08-01T12:00:00+00:00' },
    { id: 'i3', name: 'Aceite 20W-50', category: 'lubricant', detail: 'Botella 1 L', price: 7.5, min_stock: 6, is_active: true, created_at: '2026-08-01T12:00:00+00:00' },
    { id: 'i1', name: 'Agua 600 ml', category: 'convenience', detail: '', price: 0.75, min_stock: 12, is_active: true, created_at: '2026-08-01T12:00:00+00:00' },
  ],
  stock_entries: [
    { id: 'e1', branch_id: 'b2', item_id: 'i1', quantity: 24, unit_cost: 0.4, note: '', received_at: '2026-10-01T12:00:00+00:00' },
  ],
  sales: [
    { id: 'v1', branch_id: 'b2', seller_id: 'u3', kind: 'store', payment_method: 'cash', vehicle_plate: '', sold_at: '2026-10-08T13:00:00+00:00' },
    { id: 'v2', branch_id: 'b2', seller_id: 'u3', kind: 'service', payment_method: 'card', vehicle_plate: 'P123-456', sold_at: '2026-10-08T15:00:00+00:00' },
  ],
  sale_items: [
    { id: 'si1', sale_id: 'v1', item_id: 'i1', quantity: 2, unit_price: 0.75 },
    { id: 'si2', sale_id: 'v2', item_id: 'i2', quantity: 1, unit_price: 25 },
  ],
}

describe('buildGraph', () => {
  const data = buildGraph(rows)
  const escalon = data.branches[0]

  it('sorts branches, pumps, cuts and users', () => {
    expect(data.branches.map((branch) => branch.name)).toEqual(['Puma Escalón', 'Puma Merliot'])
    expect(escalon.pumps.map((pump) => pump.number)).toEqual([1, 2, 3, 4, 5, 6])
    expect(escalon.cuts.map((cut) => cut.shift)).toEqual([1, 2])
    expect(data.users.map((user) => user.firstName)).toEqual(['Elena', 'Mario', 'Roberto'])
  })

  it('attaches the movements to their cut', () => {
    const [morning, evening] = escalon.cuts
    expect(isReadyToClose(morning)).toBe(true)
    expect(totalSales(morning)).toBeCloseTo(6 * (38.4 + 38.8 + 41.9), 6)
    expect(netMovement(morning, 'regular')).toBe(5_000 - 60)
    expect(evening.losses).toHaveLength(1)
    expect(evening.closedAt).toBeNull()
  })

  it('finds the cut of a day and the manager of a branch', () => {
    expect(cutOn(escalon, new Date('2026-10-08T23:00:00Z'), 2)?.id).toBe('c2')
    // 02:00 UTC of 9 Oct is still 8 Oct in El Salvador.
    expect(cutOn(escalon, new Date('2026-10-09T02:00:00Z'), 1)?.id).toBe('c1')
    expect(managerOf(escalon, data.users)?.email).toBe('rmartinez@puma.sv')
    expect(managerOf(data.branches[1], data.users)).toBeUndefined()
    expect(hasOperation(data.branches[1])).toBe(false)
  })

  it('maps the catalog, the sales and the staff', () => {
    expect(data.catalog.map((item) => item.id)).toEqual(['i1', 'i3', 'i2'])
    expect(data.sales.map((sale) => sale.id)).toEqual(['v2', 'v1'])
    expect(data.sales[1].items[0].item?.name).toBe('Agua 600 ml')
    expect(data.sales[0].vehiclePlate).toBe('P123-456')
    expect(data.stockEntries[0]).toMatchObject({ branchId: 'b2', itemId: 'i1', quantity: 24 })
    expect(data.workShifts[0]).toMatchObject({ employeeId: 'u3', shift: 1, checkOutAt: null })
    expect(data.users.find((user) => user.id === 'u3')?.jobTitle).toBe('Pistero')
  })
})

describe('AppFormat', () => {
  it('formats like the iOS app', () => {
    expect(AppFormat.currency(12_345.678)).toBe('$12,346')
    expect(AppFormat.currency(12_345.678, true)).toBe('$12,345.68')
    expect(AppFormat.compactCurrency(12_340)).toBe('$12.3k')
    expect(AppFormat.gallons(1_234.5)).toBe('1,234.5 gal')
    expect(AppFormat.percent(0.1367)).toBe('13.7%')
    expect(AppFormat.date(new Date('2026-10-09T02:00:00Z'), 'EEE d MMM')).toBe('jue 8 oct')
  })
})
