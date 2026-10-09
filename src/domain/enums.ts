// Business enums of the iOS app (Models/Enums.swift). TS enums are not allowed
// (erasableSyntaxOnly), so they are string unions plus lookup tables.

/** Business rules fixed by the project specification. */
export const BusinessRules = {
  /** Every branch has exactly 6 fuel pumps. */
  pumpsPerBranch: 6,
  /** Two sales cuts per day (morning and evening). */
  cutsPerDay: 2,
  /** Days used to compute the average daily sales of a tank. */
  averageWindowDays: 7,
} as const

// MARK: Fuel

export const FUELS = ['diesel', 'regular', 'premium'] as const
export type FuelType = (typeof FUELS)[number]
export type FuelRecord = Record<FuelType, number>

type FuelInfo = {
  displayName: string
  shortName: string
  /** CSS color token (see index.css). */
  color: string
  /** Reference sale price per gallon. */
  referenceSalePrice: number
  /** Reference purchase cost per gallon. */
  referenceCost: number
}

export const fuelInfo: Record<FuelType, FuelInfo> = {
  diesel: { displayName: 'Diésel', shortName: 'D', color: 'var(--diesel-gray)', referenceSalePrice: 3.84, referenceCost: 3.1 },
  regular: { displayName: 'Regular', shortName: 'R', color: 'var(--brand-green)', referenceSalePrice: 3.88, referenceCost: 2.95 },
  // Sold in El Salvador as "Súper".
  premium: { displayName: 'Súper', shortName: 'S', color: 'var(--brand-red)', referenceSalePrice: 4.19, referenceCost: 3.31 },
}

export function fuelRecord(value: (fuel: FuelType) => number): FuelRecord {
  return { diesel: value('diesel'), regular: value('regular'), premium: value('premium') }
}

// MARK: Roles

export type UserRole = 'generalManager' | 'branchManager' | 'employee'

export const roleDisplayName: Record<UserRole, string> = {
  generalManager: 'Gerente general',
  branchManager: 'Gerente de sucursal',
  employee: 'Empleado',
}

// MARK: Cuts

export type CutShift = 1 | 2
export const CUT_SHIFTS: readonly CutShift[] = [1, 2]

export const shiftInfo: Record<CutShift, { displayName: string; hoursText: string; referenceHour: number }> = {
  1: { displayName: 'Matutino', hoursText: '6:00 a. m. – 2:00 p. m.', referenceHour: 10 },
  2: { displayName: 'Vespertino', hoursText: '2:00 p. m. – 10:00 p. m.', referenceHour: 18 },
}

export type CutStatus = 'open' | 'closed'

export const cutStatusDisplayName: Record<CutStatus, string> = {
  open: 'En proceso',
  closed: 'Cerrado',
}

// MARK: Losses

export type LossType = 'shrinkage' | 'leak' | 'technicalFailure' | 'spill'

export const lossTypeDisplayName: Record<LossType, string> = {
  shrinkage: 'Merma',
  leak: 'Fuga',
  technicalFailure: 'Falla técnica',
  spill: 'Derrame',
}

// MARK: Tank status (business intelligence alert)

export type TankStatus = 'critical' | 'medium' | 'optimal'

/** Lower is more urgent (critical < medium < optimal), like the Comparable enum in Swift. */
export const tankStatusRank: Record<TankStatus, number> = { critical: 0, medium: 1, optimal: 2 }

export const tankStatusInfo: Record<TankStatus, { displayName: string; color: string }> = {
  critical: { displayName: 'Crítico', color: 'var(--brand-red)' },
  medium: { displayName: 'Medio', color: 'var(--warning-amber)' },
  optimal: { displayName: 'Óptimo', color: 'var(--brand-green)' },
}

/** Critical: < 20 % or < 1.5 days of sales. Medium: < 40 % or < 3 days. Optimal: otherwise. */
export function evaluateTankStatus(ratio: number, daysLeft: number | null): TankStatus {
  const days = daysLeft ?? Infinity
  if (ratio < 0.2 || days < 1.5) return 'critical'
  if (ratio < 0.4 || days < 3) return 'medium'
  return 'optimal'
}

export function worstOf(statuses: TankStatus[]): TankStatus {
  return statuses.reduce<TankStatus>((worst, status) => (tankStatusRank[status] < tankStatusRank[worst] ? status : worst), 'optimal')
}

export const TANK_STATUS_LEGEND =
  'Crítico: < 20 % o < 1.5 días de venta · Medio: < 40 % o < 3 días · Óptimo: el resto. Los días se estiman con el promedio de venta de los últimos 7 días.'

// MARK: Store and maintenance

/** Sections of the franchise catalog. Services are not kept in stock. */
export const CATALOG_CATEGORIES = ['convenience', 'lubricant', 'service'] as const
export type CatalogCategory = (typeof CATALOG_CATEGORIES)[number]

/** Categories sold in the store (with inventory). */
export const PRODUCT_CATEGORIES: readonly CatalogCategory[] = ['convenience', 'lubricant']

export const catalogCategoryInfo: Record<CatalogCategory, { displayName: string; color: string; tracksStock: boolean }> = {
  convenience: { displayName: 'Conveniencia', color: 'var(--brand-green)', tracksStock: true },
  lubricant: { displayName: 'Lubricantes', color: 'var(--warning-amber)', tracksStock: true },
  service: { displayName: 'Mantenimiento', color: 'var(--diesel-gray)', tracksStock: false },
}

/** A sale is either a store ticket (products) or a maintenance order (services). */
export type SaleKind = 'store' | 'service'

export type PaymentMethod = 'cash' | 'card'

/** Store inventory alert of one product in one branch. */
export type StockStatus = 'out' | 'low' | 'available'

/** Lower is more urgent (out < low < available). */
export const stockStatusRank: Record<StockStatus, number> = { out: 0, low: 1, available: 2 }

export const stockStatusInfo: Record<StockStatus, { displayName: string; color: string }> = {
  out: { displayName: 'Agotado', color: 'var(--brand-red)' },
  low: { displayName: 'Bajo', color: 'var(--warning-amber)' },
  available: { displayName: 'Disponible', color: 'var(--brand-green)' },
}

/** Out: nothing left. Low: at or below the minimum of the catalog. Available: otherwise. */
export function evaluateStockStatus(available: number, minimum: number): StockStatus {
  if (available <= 0) return 'out'
  if (available <= minimum) return 'low'
  return 'available'
}
