import { Check, CircleDashed, Clock, Cylinder, Fuel, Truck } from 'lucide-react'

import { IconSquare, Pill } from '@/components/puma/primitives'
import { lossOriginText, registeredPumpCount, totalSales } from '@/domain/cut'
import { BusinessRules, fuelInfo, lossTypeDisplayName, shiftInfo, type CutShift } from '@/domain/enums'
import type { FuelLoss, FuelReception, SalesCut } from '@/domain/models'
import { AppFormat } from '@/lib/format'

// Rows used by the station detail and the cut report.

/** Compact row with the state of one of today's cuts (CutStatusRow). */
export function CutStatusRow({ shift, cut }: { shift: CutShift; cut: SalesCut | undefined }) {
  const pumps = cut ? `${registeredPumpCount(cut)}/${BusinessRules.pumpsPerBranch} bombas` : ''
  const isClosed = cut?.status === 'closed'
  const subtitle = !cut
    ? shiftInfo[shift].hoursText
    : isClosed
      ? `${pumps} · cerrado`
      : `${pumps} · ${AppFormat.currency(totalSales(cut), true)} hasta ahora`
  const color = !cut ? 'var(--muted-foreground)' : isClosed ? 'var(--brand-green)' : 'var(--warning-amber)'

  return (
    <div className="flex items-center gap-3">
      <IconSquare icon={!cut ? CircleDashed : isClosed ? Check : Clock} color={color} size={34} />
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-medium">Corte {shiftInfo[shift].displayName.toLowerCase()}</p>
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>
      {cut && isClosed ? (
        <span className="text-[15px] font-semibold">{AppFormat.currency(totalSales(cut), true)}</span>
      ) : cut ? (
        <Pill text="En proceso" color="var(--warning-amber)" />
      ) : (
        <Pill text="Sin iniciar" />
      )}
    </div>
  )
}

/** Loss or damage record (LossRow). */
export function LossRow({ loss }: { loss: FuelLoss }) {
  const details = [fuelInfo[loss.fuel].displayName, AppFormat.date(loss.recordedAt, 'd MMM'), loss.details]
    .filter(Boolean)
    .join(' · ')
  return (
    <div className="flex items-center gap-3">
      <IconSquare icon={loss.pumpNumber === null ? Cylinder : Fuel} color="var(--brand-red)" size={36} />
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-medium">
          {lossTypeDisplayName[loss.type]} · {lossOriginText(loss)}
        </p>
        <p className="line-clamp-2 text-xs text-muted-foreground">{details}</p>
      </div>
      <span className="text-[15px] font-semibold whitespace-nowrap text-brand-red">−{AppFormat.gallons(loss.gallons)}</span>
    </div>
  )
}

/** Fuel reception record (ReceptionRow). */
export function ReceptionRow({ reception }: { reception: FuelReception }) {
  return (
    <div className="flex items-center gap-3">
      <IconSquare icon={Truck} size={34} />
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-medium">
          {fuelInfo[reception.fuel].displayName} · {AppFormat.gallons(reception.gallons)}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {reception.supplier} · Factura {reception.invoiceNumber}
        </p>
      </div>
      <span className="text-[15px] font-semibold whitespace-nowrap">
        {AppFormat.currency(reception.gallons * reception.costPerGallon, true)}
      </span>
    </div>
  )
}
