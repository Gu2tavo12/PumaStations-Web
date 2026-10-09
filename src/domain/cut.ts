import { addHours, isSameDay } from 'date-fns'

import { inZone } from '@/domain/calendar'
import { BusinessRules, FUELS, fuelInfo, shiftInfo, type CutShift, type FuelType } from '@/domain/enums'
import type { Branch, FuelLoss, PumpSale, SalesCut, UserAccount } from '@/domain/models'

// Consolidated figures of a cut (CutModels.swift).

export const isClosed = (cut: SalesCut) => cut.status === 'closed'

/** Point in time used by charts and period filters: 10:00 (morning) or 18:00 (evening). */
export function referenceDate(cut: SalesCut): Date {
  return addHours(cut.day, shiftInfo[cut.shift].referenceHour)
}

export function cutTitle(cut: SalesCut): string {
  return `Corte ${shiftInfo[cut.shift].displayName.toLowerCase()}`
}

// MARK: Pumps

export function saleForPump(cut: SalesCut, number: number): PumpSale | undefined {
  return cut.pumpSales.find((sale) => sale.pumpNumber === number)
}

export function registeredPumpCount(cut: SalesCut): number {
  return new Set(cut.pumpSales.map((sale) => sale.pumpNumber)).size
}

/** A cut can be closed only when all 6 pumps have their record. */
export function isReadyToClose(cut: SalesCut): boolean {
  return registeredPumpCount(cut) >= BusinessRules.pumpsPerBranch
}

export const saleTotalAmount = (sale: PumpSale) => FUELS.reduce((sum, fuel) => sum + sale.amount[fuel], 0)
export const saleTotalGallons = (sale: PumpSale) => FUELS.reduce((sum, fuel) => sum + sale.gallons[fuel], 0)

// MARK: Sales

export const gallonsSold = (cut: SalesCut, fuel: FuelType) =>
  cut.pumpSales.reduce((sum, sale) => sum + sale.gallons[fuel], 0)

export const salesAmount = (cut: SalesCut, fuel: FuelType) =>
  cut.pumpSales.reduce((sum, sale) => sum + sale.amount[fuel], 0)

export const totalSales = (cut: SalesCut) => cut.pumpSales.reduce((sum, sale) => sum + saleTotalAmount(sale), 0)
export const totalGallons = (cut: SalesCut) => cut.pumpSales.reduce((sum, sale) => sum + saleTotalGallons(sale), 0)

// MARK: Receptions

export const gallonsReceived = (cut: SalesCut, fuel: FuelType) =>
  cut.receptions.filter((reception) => reception.fuel === fuel).reduce((sum, reception) => sum + reception.gallons, 0)

export const purchaseAmount = (cut: SalesCut, fuel: FuelType) =>
  cut.receptions
    .filter((reception) => reception.fuel === fuel)
    .reduce((sum, reception) => sum + reception.gallons * reception.costPerGallon, 0)

export const totalPurchases = (cut: SalesCut) =>
  cut.receptions.reduce((sum, reception) => sum + reception.gallons * reception.costPerGallon, 0)

export const totalReceivedGallons = (cut: SalesCut) =>
  cut.receptions.reduce((sum, reception) => sum + reception.gallons, 0)

// MARK: Losses

export const lossCost = (loss: FuelLoss) => loss.gallons * loss.costPerGallon

export function lossOriginText(loss: FuelLoss): string {
  return loss.pumpNumber !== null ? `Bomba ${loss.pumpNumber}` : `Tanque ${fuelInfo[loss.fuel].displayName}`
}

export const gallonsLost = (cut: SalesCut, fuel: FuelType) =>
  cut.losses.filter((loss) => loss.fuel === fuel).reduce((sum, loss) => sum + loss.gallons, 0)

export const lossAmount = (cut: SalesCut, fuel: FuelType) =>
  cut.losses.filter((loss) => loss.fuel === fuel).reduce((sum, loss) => sum + lossCost(loss), 0)

export const totalLossGallons = (cut: SalesCut) => cut.losses.reduce((sum, loss) => sum + loss.gallons, 0)

/** Net change the cut applies to a tank: + received − sold − lost. */
export function netMovement(cut: SalesCut, fuel: FuelType): number {
  return gallonsReceived(cut, fuel) - gallonsSold(cut, fuel) - gallonsLost(cut, fuel)
}

// MARK: Branch helpers

export function closedCuts(branch: Branch): SalesCut[] {
  return branch.cuts.filter(isClosed)
}

/** Cut of a given day and shift, if it was already started. */
export function cutOn(branch: Branch, day: Date, shift: CutShift): SalesCut | undefined {
  const local = inZone(day)
  return branch.cuts.find((cut) => cut.shift === shift && isSameDay(cut.day, local))
}

/** Branches without cuts have no operation yet (no manager has worked on them). */
export const hasOperation = (branch: Branch) => branch.cuts.length > 0

// MARK: Users

export const fullName = (user: Pick<UserAccount, 'firstName' | 'lastName'>) => `${user.firstName} ${user.lastName}`

export function initials(user: Pick<UserAccount, 'firstName' | 'lastName'>): string {
  return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
}

/** Branch managers sorted by full name. */
export function branchManagers(users: UserAccount[]): UserAccount[] {
  return users.filter((user) => user.role === 'branchManager')
}

export function managerOf(branch: Branch, users: UserAccount[]): UserAccount | undefined {
  return branchManagers(users).find((user) => user.branchId === branch.id)
}
