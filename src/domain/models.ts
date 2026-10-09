import type { TZDate } from '@date-fns/tz'

import type {
  CatalogCategory,
  CutShift,
  CutStatus,
  FuelRecord,
  FuelType,
  LossType,
  PaymentMethod,
  SaleKind,
  UserRole,
} from '@/domain/enums'

// In-memory graph of what the general manager can see in Supabase
// (Models/CoreModels.swift, CutModels.swift, StaffModels.swift and StoreModels.swift). Built by `buildGraph` in mapping.ts.

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
  /** Branch managers: the branch they are linked to. Employees: the branch where they work. */
  branchId: string | null
  /** Only for employees (e.g. "Pistero"). */
  jobTitle: string
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

/** Shift of an employee in one day, with its check-in and check-out marks (WorkShift). */
export type WorkShift = {
  id: string
  branchId: string
  employeeId: string
  /** Start of the day (El Salvador time). */
  day: TZDate
  shift: CutShift
  checkInAt: TZDate | null
  checkOutAt: TZDate | null
}

/**
 * A product (convenience or lubricant) or a maintenance service of the franchise catalog.
 * The general manager defines it once; every branch sells it at the same price.
 */
export type CatalogItem = {
  id: string
  name: string
  category: CatalogCategory
  /** Presentation of a product or what a service includes. */
  detail: string
  price: number
  /** Units a branch should keep before the low stock alert (0 for services). */
  minStock: number
  isActive: boolean
  createdAt: TZDate
}

/** Units of a product received by a branch store. Stock = entries − units sold. */
export type StockEntry = {
  id: string
  branchId: string
  itemId: string
  quantity: number
  unitCost: number
  note: string
  receivedAt: TZDate
}

/** One line of a sale. The price is copied so later catalog changes do not alter past sales. */
export type SaleItem = {
  id: string
  /** null when the catalog item is not visible (should not happen). */
  item: CatalogItem | null
  quantity: number
  unitPrice: number
}

/** A store ticket or a maintenance order registered by an employee. */
export type Sale = {
  id: string
  branchId: string
  sellerId: string | null
  kind: SaleKind
  payment: PaymentMethod
  /** Only used by maintenance orders. */
  vehiclePlate: string
  soldAt: TZDate
  items: SaleItem[]
}

/** Everything the app works with, downloaded at sign in (like RemoteSync.signIn). */
export type PumaData = {
  branches: Branch[]
  users: UserAccount[]
  /** Sorted by category and name. */
  catalog: CatalogItem[]
  stockEntries: StockEntry[]
  /** Newest first. */
  sales: Sale[]
  workShifts: WorkShift[]
}
