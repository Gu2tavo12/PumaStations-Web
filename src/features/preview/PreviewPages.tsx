import { Construction } from 'lucide-react'
import type { ReactNode } from 'react'

import { usePumaData } from '@/api/data'
import { CardHeader, InitialsAvatar, PageHeader, Pill, PumaCard } from '@/components/puma/primitives'
import { branchManagers, fullName, initials } from '@/domain/cut'
import type { PumaData } from '@/domain/models'

// Temporary managers screen; phase 5 replaces it with the full list and form.

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
