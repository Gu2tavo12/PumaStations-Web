import { Check, Clock, TriangleAlert, type LucideIcon } from 'lucide-react'

import { CardHeader, Pill, PumaCard } from '@/components/puma/primitives'
import { tint } from '@/components/puma/tint'
import { FUELS, fuelInfo, TANK_STATUS_LEGEND, tankStatusInfo, type FuelType, type TankStatus } from '@/domain/enums'
import type { TankLevel } from '@/domain/inventory'
import { AppFormat, roundTo } from '@/lib/format'
import { cn } from '@/lib/utils'

// Tank levels, status pills and restock alerts (DashboardComponents.swift).

const statusIcon: Record<TankStatus, LucideIcon> = {
  critical: TriangleAlert,
  medium: Clock,
  optimal: Check,
}

export function FuelDot({ fuel, className }: { fuel: FuelType; className?: string }) {
  return (
    <span
      className={cn('inline-block size-2 shrink-0 rounded-full', className)}
      style={{ backgroundColor: fuelInfo[fuel].color }}
      aria-hidden
    />
  )
}

export function ProgressBar({ ratio, color, height = 8 }: { ratio: number; color: string; height?: number }) {
  const width = `${Math.min(Math.max(ratio, 0), 1) * 100}%`
  return (
    <div className="w-full overflow-hidden rounded-full bg-track" style={{ height }}>
      <div className="h-full rounded-full transition-[width]" style={{ width, backgroundColor: color }} />
    </div>
  )
}

export function TankStatusPill({ status }: { status: TankStatus }) {
  const info = tankStatusInfo[status]
  return <Pill text={info.displayName} color={info.color} icon={statusIcon[status]} />
}

function daysLeftText(tank: TankLevel): string {
  return tank.daysLeft === null ? 'Sin ventas recientes' : `≈ ${AppFormat.number(roundTo(tank.daysLeft, 1))} días`
}

export function TankLevelRow({ tank }: { tank: TankLevel }) {
  const color = tankStatusInfo[tank.status].color
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <FuelDot fuel={tank.fuel} />
        <span className="text-[15px] font-semibold">{fuelInfo[tank.fuel].displayName}</span>
        <span className="flex-1" />
        <TankStatusPill status={tank.status} />
      </div>
      <ProgressBar ratio={tank.ratio} color={color} height={12} />
      <div className="flex justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {AppFormat.number(tank.stock)} de {AppFormat.gallons(tank.capacity)} · {AppFormat.percent(tank.ratio)}
        </span>
        <span className="font-semibold" style={tank.status === 'optimal' ? undefined : { color }}>
          {daysLeftText(tank)}
        </span>
      </div>
    </div>
  )
}

export function TankLevelsCard({
  title = 'Nivel de tanques',
  subtitle,
  tanks,
  showsLegend = false,
  className,
}: {
  title?: string
  subtitle?: string
  tanks: TankLevel[]
  showsLegend?: boolean
  className?: string
}) {
  return (
    <PumaCard className={cn('flex flex-col gap-4', className)}>
      <CardHeader title={title} trailing={subtitle} />
      {tanks.map((tank) => (
        <TankLevelRow key={tank.fuel} tank={tank} />
      ))}
      {showsLegend && <p className="border-t pt-3 text-xs text-muted-foreground">{TANK_STATUS_LEGEND}</p>}
    </PumaCard>
  )
}

/** Red or amber banner that recommends restocking a tank (RestockBanner). */
export function RestockBanner({ tank }: { tank: TankLevel }) {
  const color = tankStatusInfo[tank.status].color
  const name = fuelInfo[tank.fuel].displayName
  let message = `Existencia: ${AppFormat.gallons(tank.stock)}`
  if (tank.daysLeft !== null) message += ` · ≈ ${AppFormat.number(roundTo(tank.daysLeft, 1))} días de venta`
  if (tank.suggestedOrder > 0) message += `. Sugerido: pedir ${AppFormat.gallons(tank.suggestedOrder)}.`

  return (
    <StatusBanner
      icon={TriangleAlert}
      color={color}
      title={tank.status === 'critical' ? `Reabastecer ${name} hoy` : `${name} en nivel medio`}
      message={message}
    />
  )
}

/** Tinted banner with an icon, a title and a message. */
export function StatusBanner({
  icon: Icon,
  color,
  title,
  message,
}: {
  icon: LucideIcon
  color: string
  title: string
  message?: string
}) {
  return (
    <div role="status" className="flex items-start gap-3 rounded-button p-3.5" style={{ color, backgroundColor: tint(color) }}>
      <Icon className="mt-0.5 size-5 shrink-0" />
      <div>
        <p className="text-[15px] font-semibold">{title}</p>
        {message && <p className="text-[13px]">{message}</p>}
      </div>
    </div>
  )
}

/** Matrix branch × fuel with the tank level and its status color (TankMatrixCard). */
export function TankMatrixCard({
  rows,
  className,
}: {
  rows: { id: string; name: string; levels: TankLevel[] }[]
  className?: string
}) {
  return (
    <PumaCard className={cn('flex flex-col gap-3', className)}>
      <CardHeader title="Tanques por sucursal" trailing="Nivel actual" />
      <table className="w-full text-xs">
        <thead className="text-muted-foreground">
          <tr className="border-b">
            <th className="py-2 text-left font-normal">Sucursal</th>
            {FUELS.map((fuel) => (
              <th key={fuel} className="py-2 font-normal">
                {fuelInfo[fuel].displayName}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="max-w-0 truncate py-2 font-medium">{row.name.replace('Puma ', '')}</td>
              {row.levels.map((level) => (
                <td key={level.fuel} className="py-2 text-center font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="size-[9px] rounded-full"
                      style={{ backgroundColor: tankStatusInfo[level.status].color }}
                      aria-label={tankStatusInfo[level.status].displayName}
                    />
                    {AppFormat.percent(level.ratio)}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p className="text-[13px] text-muted-foreground">Sin estaciones en operación.</p>}
      <div className="flex gap-3.5 text-xs text-muted-foreground">
        {(['optimal', 'medium', 'critical'] as const).map((status) => (
          <span key={status} className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ backgroundColor: tankStatusInfo[status].color }} />
            {tankStatusInfo[status].displayName}
          </span>
        ))}
      </div>
    </PumaCard>
  )
}
