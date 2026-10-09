import { Package, TriangleAlert } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useParams } from 'react-router'

import { usePumaData } from '@/api/data'
import { SearchField, SectionFooter, Segmented } from '@/components/puma/controls'
import { BackLink, PageHeader, PumaCard } from '@/components/puma/primitives'
import { StatTile } from '@/components/puma/sales'
import { StockRow } from '@/components/puma/store'
import { catalogCategoryInfo, PRODUCT_CATEGORIES, type CatalogCategory } from '@/domain/enums'
import { stockAlerts, stockLevels } from '@/domain/store'
import { AppFormat } from '@/lib/format'

const CATEGORY_OPTIONS = PRODUCT_CATEGORIES.map((value) => ({ value, label: catalogCategoryInfo[value].displayName }))

/** Read-only store inventory of a branch for the general manager (StoreInventoryView with canRestock = false). */
export function StoreInventoryPage() {
  const { branchId } = useParams()
  const { data } = usePumaData()
  const { branches, catalog, stockEntries, sales } = data!
  const branch = branches.find((candidate) => candidate.id === branchId)
  const [category, setCategory] = useState<CatalogCategory>('convenience')
  const [search, setSearch] = useState('')

  const levels = useMemo(
    () =>
      branch
        ? stockLevels(
            catalog,
            stockEntries.filter((entry) => entry.branchId === branch.id),
            sales.filter((sale) => sale.branchId === branch.id),
          )
        : [],
    [branch, catalog, stockEntries, sales],
  )

  if (!branch) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink to="/sucursales" label="Sucursales" />
        <PumaCard>No se encontró la sucursal.</PumaCard>
      </div>
    )
  }

  const alertCount = stockAlerts(levels).length
  const totalUnits = levels.reduce((sum, level) => sum + Math.max(level.available, 0), 0)
  const stockValue = levels.reduce((sum, level) => sum + Math.max(level.available, 0) * level.item.price, 0)
  const query = search.trim().toLocaleLowerCase('es')
  const filtered = levels.filter(
    (level) => level.item.category === category && (!query || level.item.name.toLocaleLowerCase('es').includes(query)),
  )

  return (
    <div className="flex flex-col gap-4">
      <div>
        <BackLink to={`/sucursales/${branch.id}`} label={branch.name} />
        <PageHeader title="Inventario de tienda" subtitle={branch.name} />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:gap-4">
        <StatTile
          icon={Package}
          title="Unidades"
          value={AppFormat.number(totalUnits)}
          subtitle={`${AppFormat.currency(stockValue)} a precio de venta`}
        />
        <StatTile
          icon={TriangleAlert}
          title="Por reabastecer"
          value={String(alertCount)}
          subtitle="Agotados o bajo mínimo"
          valueColor={alertCount > 0 ? 'var(--brand-red)' : undefined}
        />
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <Segmented label="Categoría" value={category} options={CATEGORY_OPTIONS} onChange={setCategory} className="md:max-w-sm" />
        <SearchField value={search} onChange={setSearch} placeholder="Buscar producto" />
      </div>

      <div>
        <ul className="overflow-hidden rounded-card bg-card px-4">
          {filtered.length === 0 && <li className="py-3 text-muted-foreground">No hay productos para mostrar.</li>}
          {filtered.map((level) => (
            <li key={level.item.id} className="not-last:border-b">
              <StockRow level={level} />
            </li>
          ))}
        </ul>
        <SectionFooter>Existencia = entradas − unidades vendidas. El gerente de la sucursal registra las entradas.</SectionFooter>
      </div>
    </div>
  )
}
