import { startOfDay, subDays } from 'date-fns'

import { inZone, now as currentTime } from '@/domain/calendar'
import { closedCuts, gallonsSold, netMovement } from '@/domain/cut'
import {
  BusinessRules,
  evaluateTankStatus,
  FUELS,
  tankStatusRank,
  worstOf,
  type FuelType,
  type TankStatus,
} from '@/domain/enums'
import type { Branch, SalesCut } from '@/domain/models'

// Tank levels, daily averages and restocking alerts (InventoryCalculator.swift).

/** Current level of one tank plus the indicators used for restocking alerts. */
export type TankLevel = {
  fuel: FuelType
  stock: number
  capacity: number
  /** Average gallons sold per day in the last 7 days. */
  dailyAverage: number
  /** stock / capacity, clamped to 0…1. */
  ratio: number
  /** Estimated days until the tank runs out at the current pace (null without recent sales). */
  daysLeft: number | null
  status: TankStatus
  /** Suggested order to bring the tank to ~85 % (rounded down to 500 gal). */
  suggestedOrder: number
}

export type TankAlert = {
  branchId: string
  branchName: string
  tank: TankLevel
}

export function makeTankLevel(fuel: FuelType, stock: number, capacity: number, dailyAverage: number): TankLevel {
  const ratio = capacity > 0 ? Math.min(Math.max(stock / capacity, 0), 1) : 0
  const daysLeft = dailyAverage > 0 ? stock / dailyAverage : null
  const target = capacity * 0.85 - stock
  return {
    fuel,
    stock,
    capacity,
    dailyAverage,
    ratio,
    daysLeft,
    status: evaluateTankStatus(ratio, daysLeft),
    suggestedOrder: target > 0 ? Math.floor(target / 500) * 500 : 0,
  }
}

/** Average gallons sold per day over the 7 full days before today (today is excluded). */
export function dailyAverage(branch: Branch, fuel: FuelType, now: Date = currentTime()): number {
  const today = startOfDay(inZone(now))
  const start = subDays(today, BusinessRules.averageWindowDays)
  const sold = closedCuts(branch)
    .filter((cut) => cut.day >= start && cut.day < today)
    .reduce((sum, cut) => sum + gallonsSold(cut, fuel), 0)
  return sold / BusinessRules.averageWindowDays
}

export function tankLevels(branch: Branch, now: Date = currentTime()): TankLevel[] {
  return FUELS.map((fuel) =>
    makeTankLevel(fuel, branch.stock[fuel], branch.capacity[fuel], dailyAverage(branch, fuel, now)),
  )
}

export function worstStatus(branch: Branch, now: Date = currentTime()): TankStatus {
  return worstOf(tankLevels(branch, now).map((tank) => tank.status))
}

/** Most urgent first: by status, then by fewer days left. */
export function compareUrgency(lhs: TankLevel, rhs: TankLevel): number {
  const byStatus = tankStatusRank[lhs.status] - tankStatusRank[rhs.status]
  if (byStatus !== 0) return byStatus
  return (lhs.daysLeft ?? Infinity) - (rhs.daysLeft ?? Infinity)
}

/** Non-optimal tanks of the given branches, most urgent first. */
export function tankAlerts(branches: Branch[], now: Date = currentTime()): TankAlert[] {
  return branches
    .flatMap((branch) =>
      tankLevels(branch, now)
        .filter((tank) => tank.status !== 'optimal')
        .map((tank) => ({ branchId: branch.id, branchName: branch.name, tank })),
    )
    .sort((lhs, rhs) => compareUrgency(lhs.tank, rhs.tank))
}

/** Most urgent non-optimal tank, used for the restock banner. */
export function mainAlert(tanks: TankLevel[]): TankLevel | undefined {
  return tanks.filter((tank) => tank.status !== 'optimal').sort(compareUrgency)[0]
}

/** Stock the tank will have when the open cut is closed. */
export function projectedStock(branch: Branch, fuel: FuelType, cut: SalesCut | undefined): number {
  if (!cut || cut.status === 'closed') return branch.stock[fuel]
  return branch.stock[fuel] + netMovement(cut, fuel)
}
