import { isSameDay } from 'date-fns'

import { inZone, now as currentTime } from '@/domain/calendar'
import { fullName } from '@/domain/cut'
import {
  CATALOG_CATEGORIES,
  catalogCategoryInfo,
  evaluateStockStatus,
  PRODUCT_CATEGORIES,
  stockStatusRank,
  type CatalogCategory,
  type StockStatus,
} from '@/domain/enums'
import type { CatalogItem, Sale, StockEntry, UserAccount, WorkShift } from '@/domain/models'
import { previousRange, rangeContains, type DateRange } from '@/domain/period'

// Pure business logic of the store: inventory per product and sales metrics (StoreCalculator.swift),
// plus the staff queries of the station detail.

// MARK: Results

/** Units of one product in the store of a branch. */
export type StockLevel = {
  item: CatalogItem
  received: number
  sold: number
  /** Stock = entries − units sold. */
  available: number
  status: StockStatus
}

export type CategorySalesRow = { category: CatalogCategory; units: number; amount: number }

export type ItemSalesRow = { id: string; name: string; category: CatalogCategory; units: number; amount: number }

export type SellerSalesRow = { id: string; name: string; tickets: number; amount: number }

/** Store and maintenance sales of a period. */
export type StoreMetrics = {
  tickets: number
  categories: CategorySalesRow[]
  topItems: ItemSalesRow[]
  sellers: SellerSalesRow[]
  previousTotal: number
  /** Convenience products + lubricants. */
  storeTotal: number
  serviceTotal: number
  total: number
  averageTicket: number
  /** Relative change of sales against the previous period (null when not comparable). */
  change: number | null
}

export const saleTotal = (sale: Sale) => sale.items.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0)

export const tracksStock = (item: CatalogItem) => catalogCategoryInfo[item.category].tracksStock

// MARK: Inventory

/** Stock of every product of the catalog in one branch (active, or inactive with entries). */
export function stockLevels(items: CatalogItem[], entries: StockEntry[], sales: Sale[]): StockLevel[] {
  const received = new Map<string, number>()
  for (const entry of entries) received.set(entry.itemId, (received.get(entry.itemId) ?? 0) + entry.quantity)

  const sold = new Map<string, number>()
  for (const line of sales.flatMap((sale) => sale.items)) {
    if (!line.item) continue
    sold.set(line.item.id, (sold.get(line.item.id) ?? 0) + line.quantity)
  }

  return items
    .filter((item) => tracksStock(item) && (item.isActive || (received.get(item.id) ?? 0) > 0))
    .map((item) => {
      const itemReceived = received.get(item.id) ?? 0
      const itemSold = sold.get(item.id) ?? 0
      const available = itemReceived - itemSold
      return {
        item,
        received: itemReceived,
        sold: itemSold,
        available,
        status: evaluateStockStatus(available, item.minStock),
      }
    })
}

/** Products that need restocking, the most urgent first. */
export function stockAlerts(levels: StockLevel[]): StockLevel[] {
  return levels
    .filter((level) => level.status !== 'available' && level.item.isActive)
    .sort((a, b) => stockStatusRank[a.status] - stockStatusRank[b.status] || a.available - b.available)
}

// MARK: Sales

export function computeStoreMetrics(sales: Sale[], range: DateRange, users: UserAccount[] = []): StoreMetrics {
  const categories = new Map<CatalogCategory, CategorySalesRow>(
    CATALOG_CATEGORIES.map((category) => [category, { category, units: 0, amount: 0 }]),
  )
  const items = new Map<string, ItemSalesRow>()
  const sellers = new Map<string, SellerSalesRow>()
  const userById = new Map(users.map((user) => [user.id, user]))
  let tickets = 0

  for (const sale of sales) {
    if (!rangeContains(range, sale.soldAt)) continue
    tickets += 1
    const seller = sale.sellerId ? userById.get(sale.sellerId) : undefined
    if (seller) {
      const row = sellers.get(seller.id) ?? { id: seller.id, name: fullName(seller), tickets: 0, amount: 0 }
      row.tickets += 1
      row.amount += saleTotal(sale)
      sellers.set(seller.id, row)
    }
    for (const line of sale.items) {
      if (!line.item) continue
      const amount = line.quantity * line.unitPrice
      const category = categories.get(line.item.category)!
      category.units += line.quantity
      category.amount += amount
      const row = items.get(line.item.id) ?? { id: line.item.id, name: line.item.name, category: line.item.category, units: 0, amount: 0 }
      row.units += line.quantity
      row.amount += amount
      items.set(line.item.id, row)
    }
  }

  const categoryRows = [...categories.values()]
  const amountOf = (category: CatalogCategory) => categories.get(category)!.amount
  const total = categoryRows.reduce((sum, row) => sum + row.amount, 0)
  const previousTotal = storeSalesTotal(sales, previousRange(range))

  return {
    tickets,
    categories: categoryRows,
    topItems: [...items.values()].sort((a, b) => b.amount - a.amount),
    sellers: [...sellers.values()].sort((a, b) => b.amount - a.amount),
    previousTotal,
    storeTotal: PRODUCT_CATEGORIES.reduce((sum, category) => sum + amountOf(category), 0),
    serviceTotal: amountOf('service'),
    total,
    averageTicket: tickets > 0 ? total / tickets : 0,
    change: previousTotal > 0 ? (total - previousTotal) / previousTotal : null,
  }
}

export function storeSalesTotal(sales: Sale[], range: DateRange): number {
  return sales.filter((sale) => rangeContains(range, sale.soldAt)).reduce((sum, sale) => sum + saleTotal(sale), 0)
}

export const emptyStoreMetrics: StoreMetrics = computeStoreMetrics([], { start: new Date(0), end: new Date(0) })

// MARK: Staff

/** Employees of a branch, sorted by name (DataStore.employees(of:)). */
export function employeesOf(branchId: string, users: UserAccount[]): UserAccount[] {
  return users.filter((user) => user.role === 'employee' && user.branchId === branchId)
}

/** Checked in today and not yet out. */
export function isOnShift(shift: WorkShift, now: Date = currentTime()): boolean {
  return isSameDay(shift.day, inZone(now)) && shift.checkInAt !== null && shift.checkOutAt === null
}

// MARK: Catalog

/** Case-insensitive name check of the catalog (DataStore.isCatalogNameTaken). */
export function isCatalogNameTaken(catalog: CatalogItem[], name: string, excludingId?: string): boolean {
  const target = name.trim().toLocaleLowerCase('es')
  return catalog.some((item) => item.id !== excludingId && item.name.trim().toLocaleLowerCase('es') === target)
}
