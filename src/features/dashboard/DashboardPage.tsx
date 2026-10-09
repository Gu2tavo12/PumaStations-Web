import { Building2, Calendar, CircleCheck, Fuel, ListFilter, Truck, TriangleAlert } from 'lucide-react'
import { useMemo, useState } from 'react'

import { usePumaData } from '@/api/data'
import { FilterChip } from '@/components/puma/controls'
import { IconSquare, PageHeader, Pill, PumaCard } from '@/components/puma/primitives'
import { RefreshDataButton } from '@/components/puma/RefreshDataButton'
import { BranchSalesTableCard, FuelSalesTableCard, SalesKPICard, StatTile } from '@/components/puma/sales'
import { SalesChartCard } from '@/components/puma/SalesChartCard'
import { TankLevelsCard, TankMatrixCard, TankStatusPill } from '@/components/puma/tanks'
import { Button } from '@/components/ui/button'
import { hasOperation } from '@/domain/cut'
import { computeMetrics } from '@/domain/dashboard'
import { fuelInfo, tankStatusInfo } from '@/domain/enums'
import { tankAlerts, tankLevels, type TankAlert } from '@/domain/inventory'
import { fuelFilterFuels, fuelFilterTitle } from '@/domain/period'
import { DashboardFilterSheet } from '@/features/dashboard/DashboardFilterSheet'
import { filtersRange, periodLabel, useDashboardFilters } from '@/features/dashboard/filters'
import { AppFormat, roundTo } from '@/lib/format'
import { cn } from '@/lib/utils'

/** Consolidated dashboard of the general manager (GeneralDashboardView). */
export function DashboardPage() {
  const { data } = usePumaData()
  const branches = data!.branches
  const { filters, update, reset } = useDashboardFilters()
  const [isShowingFilters, setIsShowingFilters] = useState(false)

  // An unknown branch id in the URL falls back to the consolidated view.
  const selectedBranch = branches.find((branch) => branch.id === filters.branchId) ?? null
  const isConsolidated = selectedBranch === null
  const fuels = fuelFilterFuels(filters.fuel)

  const { metrics, alerts, tankMatrix } = useMemo(() => {
    // Branches without a manager have no operation yet.
    const scope = selectedBranch ? [selectedBranch] : branches.filter(hasOperation)
    return {
      metrics: computeMetrics(scope, filtersRange(filters), fuelFilterFuels(filters.fuel)),
      alerts: tankAlerts(scope),
      tankMatrix: scope.map((branch) => ({ id: branch.id, name: branch.name, levels: tankLevels(branch) })),
    }
  }, [branches, selectedBranch, filters])

  const openFilters = () => setIsShowingFilters(true)
  const scopeLabel = selectedBranch?.name ?? 'Todo el país'

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Dashboard"
        actions={
          <>
            <RefreshDataButton />
            <Button variant="ghost" size="icon-lg" className="text-brand-green" onClick={openFilters} aria-label="Filtros">
              <ListFilter className="size-6" />
            </Button>
          </>
        }
      />

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
        <FilterChip icon={Building2} text={scopeLabel} highlighted onClick={openFilters} />
        <FilterChip icon={Calendar} text={periodLabel(filters)} onClick={openFilters} />
        {filters.fuel !== 'all' && <FilterChip icon={Fuel} text={fuelFilterTitle(filters.fuel)} onClick={openFilters} />}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <SalesKPICard
          title={isConsolidated ? 'Ventas totales' : `Ventas · ${scopeLabel}`}
          metrics={metrics}
          className="lg:col-span-7"
        />
        <AlertsCard alerts={alerts} className="lg:col-span-5" />

        {isConsolidated ? (
          <TankMatrixCard rows={tankMatrix} className="lg:col-span-5" />
        ) : (
          tankMatrix[0] && <TankLevelsCard tanks={tankMatrix[0].levels} showsLegend className="lg:col-span-5" />
        )}
        <SalesChartCard buckets={metrics.buckets} fuels={fuels} className="lg:col-span-7" />

        <FuelSalesTableCard metrics={metrics} fuels={fuels} className={isConsolidated ? 'lg:col-span-5' : 'lg:col-span-12'} />
        {isConsolidated && <BranchSalesTableCard rows={metrics.rows} className="lg:col-span-7" />}

        <div className="grid grid-cols-2 gap-3 lg:col-span-12 lg:gap-4">
          <StatTile icon={Truck} title="Compras recibidas" value={AppFormat.currency(metrics.purchases)} subtitle="Combustible" />
          <StatTile
            icon={TriangleAlert}
            title="Pérdidas"
            value={AppFormat.gallons(Math.round(metrics.lossGallons))}
            subtitle={`${AppFormat.currency(metrics.lossAmount)} estimado`}
            valueColor="var(--brand-red)"
          />
        </div>
      </div>

      <DashboardFilterSheet
        open={isShowingFilters}
        onOpenChange={setIsShowingFilters}
        branches={branches}
        filters={filters}
        onChange={update}
        onReset={reset}
      />
    </div>
  )
}

function AlertsCard({ alerts, className }: { alerts: TankAlert[]; className?: string }) {
  const critical = alerts.filter((alert) => alert.tank.status === 'critical').length
  return (
    <PumaCard className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[17px] font-semibold">Alertas de reabastecimiento</h2>
        {critical > 0 && <Pill text={critical === 1 ? '1 crítica' : `${critical} críticas`} color="var(--brand-red)" />}
      </div>
      {alerts.length === 0 && (
        <p className="flex items-center gap-1.5 text-[15px] text-brand-green">
          <CircleCheck className="size-4" /> Todos los tanques en nivel óptimo
        </p>
      )}
      {alerts.map((alert) => (
        <div key={alert.branchId + alert.tank.fuel} className="flex items-center gap-3">
          <IconSquare icon={TriangleAlert} color={tankStatusInfo[alert.tank.status].color} size={36} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-medium">
              {alert.branchName} · {fuelInfo[alert.tank.fuel].displayName}
            </p>
            <p className="text-xs text-muted-foreground">
              {AppFormat.gallons(alert.tank.stock)}
              {alert.tank.daysLeft !== null && ` · ≈ ${AppFormat.number(roundTo(alert.tank.daysLeft, 1))} días de venta`}
            </p>
          </div>
          <TankStatusPill status={alert.tank.status} />
        </div>
      ))}
    </PumaCard>
  )
}
