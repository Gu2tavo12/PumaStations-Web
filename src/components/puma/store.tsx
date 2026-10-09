import { categoryIcon } from '@/components/puma/category-icon'
import { CardHeader, IconSquare, Pill, PumaCard } from '@/components/puma/primitives'
import { ProgressBar } from '@/components/puma/tanks'
import { catalogCategoryInfo, stockStatusInfo } from '@/domain/enums'
import type { StockLevel, StoreMetrics } from '@/domain/store'
import { AppFormat } from '@/lib/format'
import { cn } from '@/lib/utils'

// Store and maintenance cards (StoreComponents.swift).

export function StockStatusPill({ level }: { level: StockLevel }) {
  const info = stockStatusInfo[level.status]
  return <Pill text={level.status === 'out' ? info.displayName : `${level.available} uds.`} color={info.color} />
}

/** Sales of convenience products, lubricants and maintenance services in a period. */
export function StoreSalesCard({
  title = 'Tienda y mantenimiento',
  metrics,
  className,
}: {
  title?: string
  metrics: StoreMetrics
  className?: string
}) {
  const maxAmount = Math.max(...metrics.categories.map((row) => row.amount), 1)
  const change = metrics.change
  return (
    <PumaCard className={cn('flex flex-col gap-3.5', className)}>
      <CardHeader title={title} trailing={AppFormat.currency(metrics.total, true)} />
      {change !== null && (
        <div className="-mt-2 flex items-center gap-1.5">
          <Pill
            text={`${change >= 0 ? '▲' : '▼'} ${AppFormat.percent(Math.abs(change))}`}
            color={change >= 0 ? 'var(--brand-green)' : 'var(--brand-red)'}
          />
          <span className="text-[13px] text-muted-foreground">vs. periodo anterior</span>
        </div>
      )}
      {metrics.categories.map((row) => {
        const info = catalogCategoryInfo[row.category]
        const Icon = categoryIcon[row.category]
        return (
          <div key={row.category} className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-[15px]">
              <Icon className="size-4 shrink-0" style={{ color: info.color }} />
              <span>{info.displayName}</span>
              <span className="ml-auto font-semibold">{AppFormat.currency(row.amount, true)}</span>
            </div>
            <ProgressBar ratio={row.amount / maxAmount} color={info.color} />
          </div>
        )
      })}
      <div className="flex justify-between gap-3 border-t pt-2.5 text-xs text-muted-foreground">
        <span>{metrics.tickets === 1 ? '1 venta' : `${AppFormat.number(metrics.tickets)} ventas`}</span>
        <span>Ticket promedio {AppFormat.currency(metrics.averageTicket, true)}</span>
      </div>
    </PumaCard>
  )
}

/** Product row of the store inventory (StockRow). */
export function StockRow({ level }: { level: StockLevel }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <IconSquare icon={categoryIcon[level.item.category]} color={stockStatusInfo[level.status].color} size={36} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium">{level.item.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {AppFormat.currency(level.item.price, true)} · mínimo {level.item.minStock} · vendidas {level.sold}
        </p>
      </div>
      <StockStatusPill level={level} />
    </div>
  )
}
