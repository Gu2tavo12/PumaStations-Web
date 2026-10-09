import { Building2, Construction, Fuel, TriangleAlert } from 'lucide-react'
import { useMemo, type ReactNode } from 'react'

import { usePumaData } from '@/api/data'
import { CardHeader, IconSquare, InitialsAvatar, PageHeader, Pill, PumaCard } from '@/components/puma/primitives'
import { now } from '@/domain/calendar'
import { branchManagers, fullName, hasOperation, initials, managerOf } from '@/domain/cut'
import { computeMetrics } from '@/domain/dashboard'
import { fuelInfo, tankStatusInfo } from '@/domain/enums'
import { tankAlerts, worstStatus } from '@/domain/inventory'
import type { PumaData } from '@/domain/models'
import { periodRange } from '@/domain/period'
import { AppFormat, capitalize, roundTo } from '@/lib/format'

// Temporary screens (phases 1–2): they show the data computed by the domain layer so it can be
// checked against the iOS app. Phases 3, 4 and 5 replace them with the full screens.

function usePreviewData(): PumaData {
  const { data } = usePumaData()
  // DataBoundary renders the pages only after the data has loaded.
  return data!
}

function PhaseNote({ phase, children }: { phase: number; children: ReactNode }) {
  return (
    <PumaCard className="flex items-start gap-3 text-[13px] text-muted-foreground">
      <Construction className="mt-0.5 size-4 shrink-0 text-warning-amber" />
      <p>
        <span className="font-semibold text-foreground">Vista previa · Fase {phase}.</span> {children}
      </p>
    </PumaCard>
  )
}

export function DashboardPreviewPage() {
  const { branches } = usePreviewData()
  const operating = useMemo(() => branches.filter(hasOperation), [branches])
  const metrics = useMemo(() => computeMetrics(operating, periodRange('month')), [operating])
  const alerts = useMemo(() => tankAlerts(operating), [operating])
  const critical = alerts.filter((alert) => alert.tank.status === 'critical').length

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Dashboard" subtitle={`Todo el país · ${capitalize(AppFormat.date(now(), 'MMMM yyyy'))}`} />
      <PhaseNote phase={3}>Cifras calculadas con el dominio portado de iOS. El dashboard completo llega en la Fase 3.</PhaseNote>

      <div className="grid gap-4 lg:grid-cols-2">
        <PumaCard className="flex flex-col gap-1">
          <p className="text-[15px] text-muted-foreground">Ventas totales</p>
          <p className="text-[34px] leading-tight font-bold">{AppFormat.currency(metrics.totalSales)}</p>
          {metrics.salesChange !== null && (
            <div className="flex items-center gap-1.5">
              <Pill
                text={`${metrics.salesChange >= 0 ? '▲' : '▼'} ${AppFormat.percent(Math.abs(metrics.salesChange))}`}
                color={metrics.salesChange >= 0 ? 'var(--brand-green)' : 'var(--brand-red)'}
              />
              <span className="text-[13px] text-muted-foreground">vs. periodo anterior</span>
            </div>
          )}
          <div className="mt-3 grid grid-cols-2 gap-3 border-t pt-3">
            <div>
              <p className="text-[13px] text-muted-foreground">Volumen vendido</p>
              <p className="text-xl font-bold">{AppFormat.gallons(Math.round(metrics.totalGallons))}</p>
            </div>
            <div>
              <p className="text-[13px] text-muted-foreground">Margen bruto</p>
              <p className={`text-xl font-bold ${metrics.margin >= 0 ? 'text-brand-green' : 'text-brand-red'}`}>
                {AppFormat.currency(metrics.margin)}
              </p>
            </div>
          </div>
        </PumaCard>

        <PumaCard className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[17px] font-semibold">Alertas de reabastecimiento</h2>
            {critical > 0 && <Pill text={critical === 1 ? '1 crítica' : `${critical} críticas`} color="var(--brand-red)" />}
          </div>
          {alerts.length === 0 && <p className="text-[15px] text-brand-green">Todos los tanques en nivel óptimo</p>}
          {alerts.map((alert) => (
            <div key={alert.branchId + alert.tank.fuel} className="flex items-center gap-3">
              <IconSquare icon={TriangleAlert} color={tankStatusInfo[alert.tank.status].color} size={36} />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium">
                  {alert.branchName} · {fuelInfo[alert.tank.fuel].displayName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {AppFormat.gallons(alert.tank.stock)}
                  {alert.tank.daysLeft !== null && ` · ≈ ${AppFormat.number(roundTo(alert.tank.daysLeft, 1))} días de venta`}
                </p>
              </div>
              <Pill text={tankStatusInfo[alert.tank.status].displayName} color={tankStatusInfo[alert.tank.status].color} />
            </div>
          ))}
        </PumaCard>
      </div>
    </div>
  )
}

export function BranchesPreviewPage() {
  const { branches, users } = usePreviewData()

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Sucursales" />
      <PhaseNote phase={4}>Lista básica. La búsqueda, el alta de sucursales y el detalle de estación llegan en la Fase 4.</PhaseNote>
      <PumaCard className="flex flex-col gap-1 py-2">
        {branches.map((branch) => {
          const manager = managerOf(branch, users)
          const status = worstStatus(branch)
          const operating = hasOperation(branch)
          return (
            <div key={branch.id} className="flex items-center gap-3 py-2 not-last:border-b">
              <IconSquare icon={operating ? Fuel : Building2} color={operating ? 'var(--brand-green)' : 'var(--muted-foreground)'} />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{branch.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {manager ? fullName(manager) : 'Sin gerente'} · {branch.pumps.length} bombas · {branch.cuts.length} cortes
                </p>
              </div>
              {!manager ? (
                <Pill text="Sin gerente vinculado" color="var(--warning-amber)" />
              ) : (
                operating && <Pill text={tankStatusInfo[status].displayName} color={tankStatusInfo[status].color} />
              )}
            </div>
          )
        })}
      </PumaCard>
    </div>
  )
}

export function ManagersPreviewPage() {
  const { branches, users } = usePreviewData()
  const branchName = new Map(branches.map((branch) => [branch.id, branch.name]))

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Gerentes" />
      <PhaseNote phase={5}>Lista básica. Los filtros y el formulario de alta y edición llegan en la Fase 5.</PhaseNote>
      <PumaCard className="flex flex-col gap-1 py-2">
        <CardHeader title="Gerentes de sucursal" trailing={String(branchManagers(users).length)} />
        {branchManagers(users).map((manager) => (
          <div key={manager.id} className="flex items-center gap-3 py-2 not-last:border-b">
            <InitialsAvatar initials={initials(manager)} />
            <div className="min-w-0 flex-1">
              <p className="font-medium">{fullName(manager)}</p>
              <p className="truncate text-xs text-muted-foreground">{manager.email}</p>
            </div>
            <div className="flex flex-wrap justify-end gap-1.5">
              {manager.branchId ? (
                <Pill text={branchName.get(manager.branchId) ?? 'Sucursal'} color="var(--brand-green)" />
              ) : (
                <Pill text="Sin sucursal" />
              )}
              {!manager.isActive && <Pill text="Inactivo" color="var(--brand-red)" />}
            </div>
          </div>
        ))}
      </PumaCard>
    </div>
  )
}
