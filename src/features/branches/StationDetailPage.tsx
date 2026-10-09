import { ChevronRight, FuelIcon, MapPin, Package } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'

import { usePumaData } from '@/api/data'
import { Segmented } from '@/components/puma/controls'
import { BackLink, CardHeader, IconSquare, InitialsAvatar, PageHeader, Pill, PumaCard } from '@/components/puma/primitives'
import { CutStatusRow, LossRow } from '@/components/puma/rows'
import { FuelVolumeCard, SalesKPICard } from '@/components/puma/sales'
import { StoreSalesCard } from '@/components/puma/store'
import { RestockBanner, TankLevelsCard } from '@/components/puma/tanks'
import { Button } from '@/components/ui/button'
import { now } from '@/domain/calendar'
import {
  closedCuts,
  cutOn,
  fullName,
  hasOperation,
  initials,
  managerOf,
  referenceDate,
  registeredPumpCount,
  totalGallons,
  totalSales,
} from '@/domain/cut'
import { computeMetrics } from '@/domain/dashboard'
import { BusinessRules, CUT_SHIFTS, shiftInfo } from '@/domain/enums'
import { mainAlert, tankLevels } from '@/domain/inventory'
import { periodRange, periodTitle, SIMPLE_PERIODS, type PeriodFilter } from '@/domain/period'
import { computeStoreMetrics, employeesOf, isOnShift, stockAlerts, stockLevels } from '@/domain/store'
import { AppFormat, capitalize } from '@/lib/format'

const HISTORY_PAGE = 6

/** Read-only station detail for the general manager (StationDetailView). */
export function StationDetailPage() {
  const { branchId } = useParams()
  const { data } = usePumaData()
  const { branches, users, catalog, stockEntries, sales, workShifts } = data!
  const branch = branches.find((candidate) => candidate.id === branchId)
  const [params, setParams] = useSearchParams()
  const [visibleCuts, setVisibleCuts] = useState(HISTORY_PAGE)

  const periodParam = params.get('periodo')
  const period: PeriodFilter = SIMPLE_PERIODS.includes(periodParam as PeriodFilter) ? (periodParam as PeriodFilter) : 'month'

  const detail = useMemo(() => {
    if (!branch) return null
    const today = now()
    const tanks = tankLevels(branch)
    const range = periodRange(period)
    const branchSales = sales.filter((sale) => sale.branchId === branch.id)
    const levels = stockLevels(
      catalog,
      stockEntries.filter((entry) => entry.branchId === branch.id),
      branchSales,
    )
    return {
      manager: managerOf(branch, users),
      metrics: computeMetrics([branch], range),
      storeMetrics: computeStoreMetrics(branchSales, range, users),
      stockAlertCount: stockAlerts(levels).length,
      employees: employeesOf(branch.id, users),
      // Employees with a shift in progress right now.
      onShiftCount: workShifts.filter((shift) => shift.branchId === branch.id && isOnShift(shift, today)).length,
      tanks,
      alert: mainAlert(tanks),
      todayCuts: CUT_SHIFTS.map((shift) => ({ shift, cut: cutOn(branch, today, shift) })),
      recentLosses: branch.cuts
        .flatMap((cut) => cut.losses)
        .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime())
        .slice(0, 5),
      history: closedCuts(branch).sort((a, b) => referenceDate(b).getTime() - referenceDate(a).getTime()),
    }
  }, [branch, users, catalog, stockEntries, sales, workShifts, period])

  if (!branch || !detail) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink to="/sucursales" label="Sucursales" />
        <PumaCard>No se encontró la sucursal.</PumaCard>
      </div>
    )
  }

  const setPeriod = (next: PeriodFilter) =>
    setParams(next === 'month' ? {} : { periodo: next }, { replace: true })

  return (
    <div className="flex flex-col gap-4">
      <div>
        <BackLink to="/sucursales" label="Sucursales" />
        <PageHeader
          title={branch.name}
          subtitle={`${branch.code} · ${detail.manager ? `Gerente: ${fullName(detail.manager)}` : 'Sin gerente vinculado'}`}
        />
        <p className="flex items-center gap-1 text-[13px] text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          {branch.address}, {branch.municipality}
        </p>
      </div>

      {!hasOperation(branch) ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <FuelIcon className="size-10 text-muted-foreground" />
          <p className="text-xl font-bold">Sin operación</p>
          <p className="max-w-sm text-[15px] text-muted-foreground">
            Esta estación aún no registra cortes. Vincula un gerente para que empiece a operar.
          </p>
        </div>
      ) : (
        <>
          <Segmented
            label="Periodo"
            value={period}
            options={SIMPLE_PERIODS.map((value) => ({ value, label: periodTitle[value] }))}
            onChange={setPeriod}
            className="md:max-w-md"
          />

          {detail.alert && <RestockBanner tank={detail.alert} />}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <TankLevelsCard title="Tanques" tanks={detail.tanks} />
            <div className="flex flex-col gap-4">
              <SalesKPICard title="Ventas del periodo" metrics={detail.metrics} />
              <FuelVolumeCard gallons={detail.metrics.gallons} />
            </div>

            {/* Store, maintenance and staff of the station. */}
            <StoreSalesCard metrics={detail.storeMetrics} />
            <div className="flex flex-col gap-4">
              <Link
                to={`/sucursales/${branch.id}/inventario`}
                className="flex items-center gap-3 rounded-card bg-card p-4 transition-colors hover:bg-muted/50"
              >
                <IconSquare icon={Package} color={detail.stockAlertCount > 0 ? 'var(--warning-amber)' : 'var(--brand-green)'} />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold">Inventario de tienda</p>
                  <p className="text-xs text-muted-foreground">
                    {detail.stockAlertCount === 0 ? 'Sin productos por reabastecer' : `${detail.stockAlertCount} por reabastecer`}
                  </p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground/60" strokeWidth={2.5} />
              </Link>

              <PumaCard className="flex flex-col gap-3">
                <CardHeader title="Personal" trailing={`${detail.onShiftCount} en turno`} />
                {detail.employees.length === 0 && (
                  <p className="text-[13px] text-muted-foreground">Esta estación aún no tiene empleados registrados.</p>
                )}
                {detail.employees.map((employee) => (
                  <div key={employee.id} className="flex items-center gap-2.5">
                    <InitialsAvatar initials={initials(employee)} size={32} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px]">{fullName(employee)}</p>
                      <p className="truncate text-xs text-muted-foreground">{employee.jobTitle || employee.email}</p>
                    </div>
                    {!employee.isActive && <Pill text="Inactivo" color="var(--brand-red)" />}
                  </div>
                ))}
              </PumaCard>
            </div>

            <PumaCard className="flex flex-col gap-3">
              <CardHeader title="Cortes de hoy" />
              {detail.todayCuts.map(({ shift, cut }) =>
                cut ? (
                  <RowLink key={shift} to={`/sucursales/${branch.id}/cortes/${cut.id}`}>
                    <CutStatusRow shift={shift} cut={cut} />
                  </RowLink>
                ) : (
                  <CutStatusRow key={shift} shift={shift} cut={undefined} />
                ),
              )}
            </PumaCard>

            <PumaCard className="flex flex-col gap-3">
              <CardHeader title="Últimas pérdidas" trailing={AppFormat.gallons(Math.round(detail.metrics.lossGallons))} />
              {detail.recentLosses.length === 0 && <p className="text-[13px] text-muted-foreground">Sin pérdidas registradas.</p>}
              {detail.recentLosses.map((loss) => (
                <LossRow key={loss.id} loss={loss} />
              ))}
            </PumaCard>
          </div>

          <PumaCard className="flex flex-col gap-1">
            <CardHeader title="Historial de cortes" trailing={`${detail.history.length} cerrados`} />
            <ul className="pt-1">
              {detail.history.slice(0, visibleCuts).map((cut) => (
                <li key={cut.id} className="not-last:border-b">
                  <RowLink to={`/sucursales/${branch.id}/cortes/${cut.id}`}>
                    <div className="min-w-0 flex-1 py-2.5">
                      <p className="text-[15px] font-medium">
                        {capitalize(AppFormat.date(cut.day, 'EEE d MMM'))} · {shiftInfo[cut.shift].displayName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {registeredPumpCount(cut)}/{BusinessRules.pumpsPerBranch} bombas ·{' '}
                        {AppFormat.gallons(Math.round(totalGallons(cut)))}
                      </p>
                    </div>
                    <span className="text-[15px] font-semibold">{AppFormat.currency(totalSales(cut), true)}</span>
                  </RowLink>
                </li>
              ))}
            </ul>
            {visibleCuts < detail.history.length && (
              <Button variant="ghost" className="self-center text-brand-green" onClick={() => setVisibleCuts((count) => count + 20)}>
                Mostrar más
              </Button>
            )}
          </PumaCard>
        </>
      )}
    </div>
  )
}

/** Tappable row with a trailing chevron (NavigationLink). */
function RowLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="-mx-2 flex items-center gap-3 rounded-lg px-2 transition-colors hover:bg-muted/50">
      <div className="flex min-w-0 flex-1 items-center gap-3">{children}</div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground/60" strokeWidth={2.5} />
    </Link>
  )
}
