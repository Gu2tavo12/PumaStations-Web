import { inZone, parseDay } from '@/domain/calendar'
import type { CutShift } from '@/domain/enums'
import type { Branch, FuelLoss, FuelReception, PumaData, PumpSale, SalesCut, UserAccount } from '@/domain/models'
import type { Tables } from '@/lib/database.types'

/** Rows of every table, as returned by Supabase. */
export type PumaRows = {
  profiles: Tables<'profiles'>[]
  branches: Tables<'branches'>[]
  pumps: Tables<'pumps'>[]
  sales_cuts: Tables<'sales_cuts'>[]
  pump_sales: Tables<'pump_sales'>[]
  fuel_receptions: Tables<'fuel_receptions'>[]
  fuel_losses: Tables<'fuel_losses'>[]
}

function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>()
  for (const item of items) {
    const id = key(item)
    const group = groups.get(id)
    if (group) group.push(item)
    else groups.set(id, [item])
  }
  return groups
}

export function mapUser(row: Tables<'profiles'>): UserAccount {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    role: row.role,
    dui: row.dui,
    phone: row.phone,
    isActive: row.is_active,
    createdAt: inZone(row.created_at),
    branchId: row.branch_id,
  }
}

function mapPumpSale(row: Tables<'pump_sales'>): PumpSale {
  return {
    id: row.id,
    pumpNumber: row.pump_number,
    isOutOfService: row.is_out_of_service,
    gallons: { diesel: row.diesel_gallons, regular: row.regular_gallons, premium: row.premium_gallons },
    amount: { diesel: row.diesel_amount, regular: row.regular_amount, premium: row.premium_amount },
    recordedAt: inZone(row.recorded_at),
  }
}

function mapReception(row: Tables<'fuel_receptions'>): FuelReception {
  return {
    id: row.id,
    fuel: row.fuel,
    gallons: row.gallons,
    costPerGallon: row.cost_per_gallon,
    supplier: row.supplier,
    invoiceNumber: row.invoice_number,
    receivedAt: inZone(row.received_at),
  }
}

function mapLoss(row: Tables<'fuel_losses'>): FuelLoss {
  return {
    id: row.id,
    type: row.type,
    fuel: row.fuel,
    gallons: row.gallons,
    costPerGallon: row.cost_per_gallon,
    pumpNumber: row.pump_number,
    details: row.details,
    recordedAt: inZone(row.recorded_at),
  }
}

/** Builds the in-memory graph (branches → pumps and cuts → movements) from the table rows. */
export function buildGraph(rows: PumaRows): PumaData {
  const salesByCut = groupBy(rows.pump_sales, (row) => row.cut_id)
  const receptionsByCut = groupBy(rows.fuel_receptions, (row) => row.cut_id)
  const lossesByCut = groupBy(rows.fuel_losses, (row) => row.cut_id)
  const pumpsByBranch = groupBy(rows.pumps, (row) => row.branch_id)

  const cuts: SalesCut[] = rows.sales_cuts.map((row) => ({
    id: row.id,
    branchId: row.branch_id,
    day: parseDay(row.day),
    shift: (row.shift === 2 ? 2 : 1) as CutShift,
    status: row.status,
    openedAt: inZone(row.opened_at),
    closedAt: row.closed_at ? inZone(row.closed_at) : null,
    opening: { diesel: row.opening_diesel, regular: row.opening_regular, premium: row.opening_premium },
    pumpSales: (salesByCut.get(row.id) ?? []).map(mapPumpSale).sort((a, b) => a.pumpNumber - b.pumpNumber),
    receptions: (receptionsByCut.get(row.id) ?? []).map(mapReception),
    losses: (lossesByCut.get(row.id) ?? []).map(mapLoss),
  }))
  const cutsByBranch = groupBy(cuts, (cut) => cut.branchId)

  const branches: Branch[] = rows.branches
    .map((row) => ({
      id: row.id,
      name: row.name,
      code: row.code,
      address: row.address,
      municipality: row.municipality,
      phone: row.phone,
      createdAt: inZone(row.created_at),
      capacity: { diesel: row.diesel_capacity, regular: row.regular_capacity, premium: row.premium_capacity },
      stock: { diesel: row.diesel_stock, regular: row.regular_stock, premium: row.premium_stock },
      pumps: (pumpsByBranch.get(row.id) ?? [])
        .map((pump) => ({ id: pump.id, number: pump.number }))
        .sort((a, b) => a.number - b.number),
      cuts: (cutsByBranch.get(row.id) ?? []).sort((a, b) => a.day.getTime() - b.day.getTime() || a.shift - b.shift),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))

  const users = rows.profiles
    .map(mapUser)
    .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`, 'es'))

  return { branches, users }
}
