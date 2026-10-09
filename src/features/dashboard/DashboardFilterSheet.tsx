import { Check } from 'lucide-react'

import { FormSection, Segmented } from '@/components/puma/controls'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { Branch } from '@/domain/models'
import { FUEL_FILTERS, fuelFilterTitle, PERIOD_FILTERS, periodTitle } from '@/domain/period'
import type { DashboardFilters } from '@/features/dashboard/filters'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

/** Scope, period and fuel filters (DashboardFilterSheet). Changes apply right away. */
export function DashboardFilterSheet({
  open,
  onOpenChange,
  branches,
  filters,
  onChange,
  onReset,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  branches: Branch[]
  filters: DashboardFilters
  onChange: (changes: Partial<DashboardFilters>) => void
  onReset: () => void
}) {
  const isMobile = useIsMobile()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        className={cn('gap-0 bg-background', isMobile ? 'max-h-[90svh] rounded-t-2xl' : 'sm:max-w-md')}
      >
        <SheetHeader>
          <SheetTitle className="text-[17px]">Filtros</SheetTitle>
          <SheetDescription>Alcance, periodo y combustible del dashboard.</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 overflow-y-auto px-4 pb-4">
          <FormSection title="Alcance">
            <div className="flex flex-col">
              <ScopeOption label="Todo el país (consolidado)" selected={filters.branchId === null} onSelect={() => onChange({ branchId: null })} />
              {branches.map((branch) => (
                <ScopeOption
                  key={branch.id}
                  label={branch.name}
                  selected={filters.branchId === branch.id}
                  onSelect={() => onChange({ branchId: branch.id })}
                />
              ))}
            </div>
          </FormSection>

          <FormSection title="Periodo">
            <div className="flex flex-col gap-3 py-3">
              <Segmented
                label="Periodo"
                value={filters.period}
                options={PERIOD_FILTERS.map((period) => ({ value: period, label: periodTitle[period] }))}
                onChange={(period) => onChange({ period })}
              />
              {filters.period === 'custom' && (
                <div className="flex flex-col">
                  <DateRow label="Desde" value={filters.from} max={filters.to} onChange={(from) => onChange({ from })} />
                  <DateRow label="Hasta" value={filters.to} min={filters.from} onChange={(to) => onChange({ to })} />
                </div>
              )}
            </div>
          </FormSection>

          <FormSection title="Combustible">
            <div className="py-3">
              <Segmented
                label="Combustible"
                value={filters.fuel}
                options={FUEL_FILTERS.map((fuel) => ({ value: fuel, label: fuelFilterTitle(fuel) }))}
                onChange={(fuel) => onChange({ fuel })}
              />
            </div>
          </FormSection>
        </div>

        <SheetFooter className="flex-row border-t bg-card">
          <Button variant="ghost" className="flex-1 text-brand-green" onClick={onReset}>
            Limpiar
          </Button>
          <Button className="flex-1 font-semibold" onClick={() => onOpenChange(false)}>
            Aplicar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function ScopeOption({ label, selected, onSelect }: { label: string; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className="flex items-center justify-between gap-3 py-3 text-left text-[17px] not-last:border-b"
    >
      {label}
      {selected && <Check className="size-5 text-brand-green" strokeWidth={2.5} />}
    </button>
  )
}

function DateRow({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: string
  min?: string
  max?: string
  onChange: (value: string) => void
}) {
  return (
    <label className="flex items-center justify-between gap-3 py-2 text-[17px] not-last:border-b">
      {label}
      <input
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(event) => event.target.value && onChange(event.target.value)}
        className="rounded-lg bg-track px-2.5 py-1 text-[15px] [color-scheme:light] dark:[color-scheme:dark]"
      />
    </label>
  )
}
