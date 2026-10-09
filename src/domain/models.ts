import type { TZDate } from '@date-fns/tz'

import type { CutShift, CutStatus, FuelRecord, FuelType, LossType, UserRole } from '@/domain/enums'

// In-memory graph of what the general manager can see in Supabase
// (Models/CoreModels.swift + CutModels.swift). Built by `buildGraph` in mapping.ts.

export type UserAccount = {
  id: string
  firstName: string
  lastName: string
  email: string
  role: UserRole
  dui: string
  phone: string
  isActive: boolean
  createdAt: TZDate
  /** Only for branch managers: the branch they are linked to. */
  branchId: string | null
}

export type Pump = {
  id: string
  number: number
}

/** Service station. */
export type Branch = {
  id: string
  name: string
  code: string
  address: string
  municipality: string
  phone: string
  createdAt: TZDate
  capacity: FuelRecord
  stock: FuelRecord
  /** Sorted by number. */
  pumps: Pump[]
  /** Sorted by day and shift. */
  cuts: SalesCut[]
}

/** Sales of one pump in one cut, for the three fuels. */
export type PumpSale = {
  id: string
  pumpNumber: number
  isOutOfService: boolean
  gallons: FuelRecord
  amount: FuelRecord
  recordedAt: TZDate
}

export type FuelReception = {
  id: string
  fuel: FuelType
  gallons: number
  costPerGallon: number
  supplier: string
  invoiceNumber: string
  receivedAt: TZDate
}

export type FuelLoss = {
  id: string
  type: LossType
  fuel: FuelType
  gallons: number
  costPerGallon: number
  /** Pump where it happened; null means the storage tank. */
  pumpNumber: number | null
  details: string
  recordedAt: TZDate
}

/** One of the two daily cuts of a branch, with its three movement categories. */
export type SalesCut = {
  id: string
  branchId: string
  /** Start of the day (El Salvador time). */
  day: TZDate
  shift: CutShift
  status: CutStatus
  openedAt: TZDate
  closedAt: TZDate | null
  /** Tank stock when the cut was closed (before applying its movements). */
  opening: FuelRecord
  pumpSales: PumpSale[]
  receptions: FuelReception[]
  losses: FuelLoss[]
}

/** Everything the app works with, downloaded at sign in (like RemoteSync.signIn). */
export type PumaData = {
  branches: Branch[]
  users: UserAccount[]
}
