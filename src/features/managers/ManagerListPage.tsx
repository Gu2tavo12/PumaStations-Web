import { ChevronRight, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'

import { usePumaData } from '@/api/data'
import { SearchField, SectionFooter, Segmented } from '@/components/puma/controls'
import { InitialsAvatar, PageHeader, Pill } from '@/components/puma/primitives'
import { Button } from '@/components/ui/button'
import { branchManagers, fullName, initials } from '@/domain/cut'
import type { UserAccount } from '@/domain/models'
import { ManagerFormDialog } from '@/features/managers/ManagerFormDialog'

type ManagerFilter = 'all' | 'linked' | 'unlinked'

const FILTERS: { value: ManagerFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'linked', label: 'Vinculados' },
  { value: 'unlinked', label: 'Sin sucursal' },
]

/** Branch managers of the general manager (ManagerListView). */
export function ManagerListPage() {
  const { data } = usePumaData()
  const { branches, users } = data!
  const [filter, setFilter] = useState<ManagerFilter>('all')
  const [search, setSearch] = useState('')
  // undefined = closed, null = new manager, otherwise the manager being edited.
  const [editing, setEditing] = useState<UserAccount | null | undefined>(undefined)

  const managers = useMemo(() => branchManagers(users), [users])
  const branchName = useMemo(() => new Map(branches.map((branch) => [branch.id, branch.name])), [branches])

  const query = search.trim().toLocaleLowerCase('es')
  const filtered = managers.filter((manager) => {
    const matchesFilter =
      filter === 'all' || (filter === 'linked' ? manager.branchId !== null : manager.branchId === null)
    const matchesSearch =
      !query ||
      fullName(manager).toLocaleLowerCase('es').includes(query) ||
      manager.email.toLocaleLowerCase('es').includes(query)
    return matchesFilter && matchesSearch
  })

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Gerentes"
        actions={
          <Button onClick={() => setEditing(null)} className="rounded-full" aria-label="Nuevo gerente">
            <Plus /> <span className="hidden sm:inline">Nuevo gerente</span>
          </Button>
        }
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <Segmented label="Filtro" value={filter} options={FILTERS} onChange={setFilter} className="md:max-w-sm" />
        <SearchField value={search} onChange={setSearch} placeholder="Buscar gerente" />
      </div>

      <div>
        <ul className="overflow-hidden rounded-card bg-card">
          {filtered.length === 0 && <li className="px-4 py-3 text-muted-foreground">No hay gerentes para mostrar.</li>}
          {filtered.map((manager) => (
            <li key={manager.id} className="not-last:border-b">
              <button
                type="button"
                onClick={() => setEditing(manager)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
              >
                <InitialsAvatar initials={initials(manager)} />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="font-medium">{fullName(manager)}</p>
                  <p className="truncate text-xs text-muted-foreground">{manager.email}</p>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {manager.branchId ? (
                      <Pill text={branchName.get(manager.branchId) ?? 'Sucursal'} color="var(--brand-green)" />
                    ) : (
                      <Pill text="Sin sucursal" />
                    )}
                    {!manager.isActive && <Pill text="Inactivo" color="var(--brand-red)" />}
                  </div>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground/60" strokeWidth={2.5} />
              </button>
            </li>
          ))}
        </ul>
        <SectionFooter>
          Cada sucursal tiene un solo gerente. Un gerente solo ve y registra información de su sucursal.
        </SectionFooter>
      </div>

      <ManagerFormDialog
        open={editing !== undefined}
        manager={editing ?? null}
        onOpenChange={(open) => !open && setEditing(undefined)}
      />
    </div>
  )
}
