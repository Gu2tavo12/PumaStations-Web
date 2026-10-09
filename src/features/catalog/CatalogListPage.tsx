import { ChevronRight, Plus } from 'lucide-react'
import { useState } from 'react'

import { usePumaData } from '@/api/data'
import { SearchField, SectionFooter, Segmented } from '@/components/puma/controls'
import { IconSquare, PageHeader, Pill } from '@/components/puma/primitives'
import { categoryIcon } from '@/components/puma/category-icon'
import { Button } from '@/components/ui/button'
import { CATALOG_CATEGORIES, catalogCategoryInfo, type CatalogCategory } from '@/domain/enums'
import type { CatalogItem } from '@/domain/models'
import { CatalogItemFormDialog } from '@/features/catalog/CatalogItemFormDialog'
import { AppFormat } from '@/lib/format'

const CATEGORY_OPTIONS = CATALOG_CATEGORIES.map((value) => ({ value, label: catalogCategoryInfo[value].displayName }))

/** Products (convenience and lubricants) and maintenance services sold by every branch (CatalogListView). */
export function CatalogListPage() {
  const { data } = usePumaData()
  const catalog = data!.catalog
  const [category, setCategory] = useState<CatalogCategory>('convenience')
  const [search, setSearch] = useState('')
  // undefined = closed, null = new item, otherwise the item being edited.
  const [editing, setEditing] = useState<CatalogItem | null | undefined>(undefined)

  const query = search.trim().toLocaleLowerCase('es')
  const filtered = catalog.filter(
    (item) => item.category === category && (!query || item.name.toLocaleLowerCase('es').includes(query)),
  )
  const activeCount = catalog.filter((item) => item.category === category && item.isActive).length

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Catálogo"
        actions={
          <Button onClick={() => setEditing(null)} className="rounded-full" aria-label="Nuevo artículo">
            <Plus /> <span className="hidden sm:inline">Nuevo artículo</span>
          </Button>
        }
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <Segmented label="Categoría" value={category} options={CATEGORY_OPTIONS} onChange={setCategory} className="md:max-w-md" />
        <SearchField value={search} onChange={setSearch} placeholder="Buscar en el catálogo" />
      </div>

      <div>
        <h2 className="px-4 pb-1.5 text-[13px] text-muted-foreground uppercase">
          {activeCount === 1 ? '1 activo' : `${activeCount} activos`}
        </h2>
        <ul className="overflow-hidden rounded-card bg-card">
          {filtered.length === 0 && <li className="px-4 py-3 text-muted-foreground">No hay artículos en esta categoría.</li>}
          {filtered.map((item) => (
            <li key={item.id} className="not-last:border-b">
              <button
                type="button"
                onClick={() => setEditing(item)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
              >
                <IconSquare
                  icon={categoryIcon[item.category]}
                  color={item.isActive ? catalogCategoryInfo[item.category].color : 'var(--muted-foreground)'}
                />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="font-medium">{item.name}</p>
                  {item.detail && <p className="truncate text-xs text-muted-foreground">{item.detail}</p>}
                  {!item.isActive && (
                    <div className="pt-0.5">
                      <Pill text="Inactivo" color="var(--brand-red)" />
                    </div>
                  )}
                </div>
                <span className="text-[15px] font-semibold tabular-nums">{AppFormat.currency(item.price, true)}</span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground/60" strokeWidth={2.5} />
              </button>
            </li>
          ))}
        </ul>
        <SectionFooter>
          {category === 'service'
            ? 'Los servicios de mantenimiento no llevan inventario. El precio aplica a todas las sucursales.'
            : 'El precio aplica a todas las sucursales. Cada sucursal lleva su propia existencia y recibe un aviso al llegar al mínimo.'}
        </SectionFooter>
      </div>

      <CatalogItemFormDialog
        open={editing !== undefined}
        item={editing ?? null}
        defaultCategory={category}
        onOpenChange={(open) => !open && setEditing(undefined)}
      />
    </div>
  )
}
