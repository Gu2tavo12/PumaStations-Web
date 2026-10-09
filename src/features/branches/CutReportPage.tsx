import { CircleCheck, Lock, Truck, TriangleAlert } from 'lucide-react'
import { useParams } from 'react-router'

import { usePumaData } from '@/api/data'
import { BackLink, CardHeader, PageHeader, PumaCard } from '@/components/puma/primitives'
import { LossRow, ReceptionRow } from '@/components/puma/rows'
import { StatTile } from '@/components/puma/sales'
import { FuelDot, StatusBanner } from '@/components/puma/tanks'
import {
  cutTitle,
  gallonsLost,
  gallonsReceived,
  gallonsSold,
  isClosed,
  isReadyToClose,
  registeredPumpCount,
  saleTotalAmount,
  totalGallons,
  totalLossGallons,
  totalPurchases,
  totalReceivedGallons,
  totalSales,
} from '@/domain/cut'
import { BusinessRules, FUELS, fuelInfo } from '@/domain/enums'
import type { Branch, SalesCut } from '@/domain/models'
import { AppFormat, capitalize, roundTo } from '@/lib/format'

/** Consolidated report of a cut, read only (CutReportView). */
export function CutReportPage() {
  const { branchId, cutId } = useParams()
  const { data } = usePumaData()
  const branch = data!.branches.find((candidate) => candidate.id === branchId)
  const cut = branch?.cuts.find((candidate) => candidate.id === cutId)
  const back = <BackLink to={`/sucursales/${branchId}`} label={branch?.name ?? 'Sucursal'} />

  if (!branch || !cut) {
    return (
      <div className="flex flex-col gap-4">
        {back}
        <PumaCard>No se encontró el corte.</PumaCard>
      </div>
    )
  }

  const losses = totalLossGallons(cut)

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <div>
        {back}
        <PageHeader title={isClosed(cut) ? 'Reporte del corte' : 'Corte en proceso'} />
      </div>

      <CutStatusBanner cut={cut} />

      <PumaCard className="flex flex-col gap-1">
        <p className="text-[15px] text-muted-foreground">
          {cutTitle(cut)} · {capitalize(AppFormat.date(cut.day, 'EEE d MMM'))}
        </p>
        <p className="text-[34px] leading-tight font-bold">{AppFormat.currency(totalSales(cut), true)}</p>
        <p className="text-[13px] text-muted-foreground">
          {AppFormat.gallons(totalGallons(cut))} vendidos · {branch.name}
        </p>
      </PumaCard>

      <PumpsTable cut={cut} />

      <div className="grid grid-cols-2 gap-3">
        <StatTile
          icon={Truck}
          title="2 · Recepciones"
          value={AppFormat.gallons(totalReceivedGallons(cut))}
          subtitle={cut.receptions.length === 0 ? 'Sin compras' : AppFormat.currency(totalPurchases(cut), true)}
        />
        <StatTile
          icon={TriangleAlert}
          title="3 · Pérdidas"
          value={AppFormat.gallons(losses)}
          subtitle={cut.losses.length === 0 ? 'Sin pérdidas' : `${cut.losses.length} registro(s)`}
          valueColor={losses > 0 ? 'var(--brand-red)' : undefined}
        />
      </div>

      {(cut.receptions.length > 0 || cut.losses.length > 0) && (
        <PumaCard className="flex flex-col gap-3">
          <CardHeader title="Detalle de movimientos" />
          {cut.receptions.map((reception) => (
            <ReceptionRow key={reception.id} reception={reception} />
          ))}
          {cut.losses.map((loss) => (
            <LossRow key={loss.id} loss={loss} />
          ))}
        </PumaCard>
      )}

      <InventoryTable cut={cut} branch={branch} />
    </div>
  )
}

function CutStatusBanner({ cut }: { cut: SalesCut }) {
  const pumps = BusinessRules.pumpsPerBranch
  if (isClosed(cut)) {
    return (
      <StatusBanner
        icon={Lock}
        color="var(--brand-green)"
        title="Corte cerrado"
        message={cut.closedAt ? `Cerrado el ${AppFormat.date(cut.closedAt, 'd MMM, h:mm aaaa')}.` : undefined}
      />
    )
  }
  if (isReadyToClose(cut)) {
    return (
      <StatusBanner
        icon={CircleCheck}
        color="var(--brand-green)"
        title={`${pumps} de ${pumps} bombas registradas`}
        message="El gerente de la sucursal aún no lo cierra. Las cifras no cuentan en el dashboard hasta el cierre."
      />
    )
  }
  return (
    <StatusBanner
      icon={TriangleAlert}
      color="var(--warning-amber)"
      title="Faltan bombas por registrar"
      message={`Registradas ${registeredPumpCount(cut)} de ${pumps}.`}
    />
  )
}

function PumpsTable({ cut }: { cut: SalesCut }) {
  return (
    <PumaCard className="flex flex-col gap-3">
      <CardHeader title="1 · Ventas por bomba" trailing="galones" />
      <div className="overflow-x-auto">
        <table className="w-full text-right text-[13px] font-medium whitespace-nowrap tabular-nums">
          <thead className="text-xs text-muted-foreground">
            <tr className="border-b">
              <th className="py-2 pr-2 text-left font-normal">Bomba</th>
              {FUELS.map((fuel) => (
                <th key={fuel} className="px-2 py-2 font-normal">
                  {fuelInfo[fuel].displayName}
                </th>
              ))}
              <th className="py-2 pl-2 font-normal">Monto</th>
            </tr>
          </thead>
          <tbody>
            {cut.pumpSales.map((sale) => (
              <tr key={sale.id}>
                <td className="py-2 pr-2 text-left">B{sale.pumpNumber}</td>
                {sale.isOutOfService ? (
                  <td colSpan={FUELS.length} className="px-2 py-2 text-center text-muted-foreground">
                    Fuera de servicio
                  </td>
                ) : (
                  FUELS.map((fuel) => (
                    <td key={fuel} className="px-2 py-2">
                      {AppFormat.number(Math.round(sale.gallons[fuel]))}
                    </td>
                  ))
                )}
                <td className="py-2 pl-2">{AppFormat.currency(saleTotalAmount(sale), true)}</td>
              </tr>
            ))}
            {cut.pumpSales.length === 0 && (
              <tr>
                <td colSpan={FUELS.length + 2} className="py-2 text-left text-muted-foreground">
                  Aún no hay bombas registradas.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot className="border-t font-bold">
            <tr>
              <td className="py-2 pr-2 text-left">Total</td>
              {FUELS.map((fuel) => (
                <td key={fuel} className="px-2 py-2">
                  {AppFormat.number(Math.round(gallonsSold(cut, fuel)))}
                </td>
              ))}
              <td className="py-2 pl-2">{AppFormat.currency(totalSales(cut), true)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </PumaCard>
  )
}

function InventoryTable({ cut, branch }: { cut: SalesCut; branch: Branch }) {
  const rows = FUELS.map((fuel) => {
    // Closed cuts use the stored opening stock; open cuts start from the current stock.
    const opening = isClosed(cut) ? cut.opening[fuel] : branch.stock[fuel]
    const received = gallonsReceived(cut, fuel)
    const sold = gallonsSold(cut, fuel)
    const lost = gallonsLost(cut, fuel)
    return { fuel, opening, received, sold, lost, closing: opening + received - sold - lost }
  })

  return (
    <PumaCard className="flex flex-col gap-3">
      <CardHeader title="Inventario de tanques" trailing="galones" />
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs whitespace-nowrap tabular-nums">
          <thead className="text-muted-foreground">
            <tr className="border-b">
              <th className="py-2 pr-2 text-left font-normal">Tanque</th>
              <th className="px-2 py-2 font-normal">Inicial</th>
              <th className="px-2 py-2 font-normal">Recib.</th>
              <th className="px-2 py-2 font-normal">Vend.</th>
              <th className="px-2 py-2 font-normal">Pérd.</th>
              <th className="py-2 pl-2 font-normal">Final</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.fuel}>
                <td className="py-2 pr-2 text-left">
                  <span className="inline-flex items-center gap-1">
                    <FuelDot fuel={row.fuel} />
                    {fuelInfo[row.fuel].displayName}
                  </span>
                </td>
                <td className="px-2 py-2">{AppFormat.number(Math.round(row.opening))}</td>
                <td className="px-2 py-2">+{AppFormat.number(Math.round(row.received))}</td>
                <td className="px-2 py-2">−{AppFormat.number(Math.round(row.sold))}</td>
                <td className={row.lost > 0 ? 'px-2 py-2 text-brand-red' : 'px-2 py-2'}>
                  {row.lost > 0 ? `−${AppFormat.number(roundTo(row.lost, 1))}` : '0'}
                </td>
                <td className={row.closing < 0 ? 'py-2 pl-2 font-bold text-brand-red' : 'py-2 pl-2 font-bold'}>
                  {AppFormat.number(Math.round(row.closing))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PumaCard>
  )
}
