import { Building2, ChevronRight, Fuel, Plus, TriangleAlert } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'

import { usePumaData } from '@/api/data'
import { SearchField, SectionFooter } from '@/components/puma/controls'
import { IconSquare, PageHeader, Pill } from '@/components/puma/primitives'
import { StatTile } from '@/components/puma/sales'
import { TankStatusPill } from '@/components/puma/tanks'
import { Button } from '@/components/ui/button'
import { fullName, hasOperation, managerOf } from '@/domain/cut'
import { totalSalesOf } from '@/domain/dashboard'
import { worstStatus } from '@/domain/inventory'
import { periodRange } from '@/domain/period'
import { BranchFormDialog } from '@/features/branches/BranchFormDialog'
import { AppFormat } from '@/lib/format'

/** Branch list of the general manager (BranchListView). */
export function BranchListPage() {
  const { data } = usePumaData()
  const { branches, users } = data!
  const [search, setSearch] = useState('')
  const [isShowingForm, setIsShowingForm] = useState(false)

  const items = useMemo(() => {
    const month = periodRange('month')
    return branches.map((branch) => ({
      branch,
      manager: managerOf(branch, users),
      monthSales: totalSalesOf([branch], month),
      worstStatus: worstStatus(branch),
      hasOperation: hasOperation(branch),
    }))
  }, [branches, users])

  const query = search.trim().toLocaleLowerCase('es')
  const filtered = query
    ? items.filter(
        ({ branch }) =>
          branch.name.toLocaleLowerCase('es').includes(query) ||
          branch.municipality.toLocaleLowerCase('es').includes(query),
      )
    : items
  const totalPumps = items.reduce((sum, item) => sum + item.branch.pumps.length, 0)
  const criticalCount = items.filter((item) => item.hasOperation && item.worstStatus === 'critical').length

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Sucursales"
        actions={
          <Button onClick={() => setIsShowingForm(true)} className="rounded-full" aria-label="Nueva sucursal">
            <Plus /> <span className="hidden sm:inline">Nueva sucursal</span>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:max-w-xl">
        <StatTile icon={Building2} title="Estaciones" value={String(items.length)} subtitle={`${totalPumps} bombas`} />
        <StatTile
          icon={TriangleAlert}
          title="Con alerta crítica"
          value={String(criticalCount)}
          subtitle="Reabastecer hoy"
          valueColor={criticalCount > 0 ? 'var(--brand-red)' : undefined}
        />
      </div>

      <SearchField value={search} onChange={setSearch} placeholder="Buscar sucursal" />

      <div>
        <ul className="overflow-hidden rounded-card bg-card">
          {filtered.length === 0 && <li className="px-4 py-3 text-muted-foreground">No hay sucursales para mostrar.</li>}
          {filtered.map((item) => (
            <li key={item.branch.id} className="not-last:border-b">
              <Link
                to={`/sucursales/${item.branch.id}`}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <IconSquare icon={Fuel} color={item.hasOperation ? 'var(--brand-green)' : 'var(--muted-foreground)'} />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="font-medium">{item.branch.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{item.branch.address}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.manager ? fullName(item.manager) : 'Sin gerente'} · {item.branch.pumps.length} bombas
                  </p>
                  <div className="pt-0.5">
                    {!item.manager ? (
                      <Pill text="Sin gerente vinculado" color="var(--warning-amber)" />
                    ) : (
                      item.hasOperation && <TankStatusPill status={item.worstStatus} />
                    )}
                  </div>
                </div>
                {item.hasOperation && (
                  <div className="text-right">
                    <p className="text-[15px] font-semibold">{AppFormat.currency(item.monthSales)}</p>
                    <p className="text-[11px] text-muted-foreground">ventas</p>
                  </div>
                )}
                <ChevronRight className="size-4 shrink-0 text-muted-foreground/60" strokeWidth={2.5} />
              </Link>
            </li>
          ))}
        </ul>
        <SectionFooter>El estado muestra el tanque más comprometido de cada estación. Ventas del mes en curso.</SectionFooter>
      </div>

      <BranchFormDialog open={isShowingForm} onOpenChange={setIsShowingForm} />
    </div>
  )
}
