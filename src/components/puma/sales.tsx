import type { LucideIcon } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { CardHeader, Pill, PumaCard } from '@/components/puma/primitives'
import { FuelDot, ProgressBar } from '@/components/puma/tanks'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import type { BranchMetricRow, ChartBucket, DashboardMetrics } from '@/domain/dashboard'
import { FUELS, fuelInfo, type FuelRecord, type FuelType } from '@/domain/enums'
import { AppFormat } from '@/lib/format'
import { cn } from '@/lib/utils'

// Sales cards of the dashboards (DashboardComponents.swift).

export function StatTile({
  icon: Icon,
  title,
  value,
  subtitle,
  valueColor,
  className,
}: {
  icon: LucideIcon
  title: string
  value: string
  subtitle?: string
  valueColor?: string
  className?: string
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5 rounded-card bg-card p-3.5', className)}>
      <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
        <Icon className="size-4 shrink-0" />
        <span className="truncate">{title}</span>
      </span>
      <span className="truncate text-xl font-bold" style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </span>
      {subtitle && <span className="truncate text-xs text-muted-foreground">{subtitle}</span>}
    </div>
  )
}

const marginColor = (value: number) => (value >= 0 ? 'var(--brand-green)' : 'var(--brand-red)')

export function SalesKPICard({ title, metrics, className }: { title: string; metrics: DashboardMetrics; className?: string }) {
  const change = metrics.salesChange
  return (
    <PumaCard className={cn('flex flex-col gap-1', className)}>
      <p className="text-[15px] text-muted-foreground">{title}</p>
      <p className="truncate text-[34px] leading-tight font-bold">{AppFormat.currency(metrics.totalSales)}</p>
      {change !== null && (
        <div className="flex items-center gap-1.5">
          <Pill
            text={`${change >= 0 ? '▲' : '▼'} ${AppFormat.percent(Math.abs(change))}`}
            color={change >= 0 ? 'var(--brand-green)' : 'var(--brand-red)'}
          />
          <span className="text-[13px] text-muted-foreground">vs. periodo anterior</span>
        </div>
      )}
      <div className="mt-2.5 grid grid-cols-2 divide-x border-t pt-2.5">
        <div className="min-w-0 pr-3">
          <p className="text-[13px] text-muted-foreground">Volumen vendido</p>
          <p className="truncate text-xl font-bold">{AppFormat.gallons(metrics.totalGallons)}</p>
        </div>
        <div className="min-w-0 pl-3">
          <p className="text-[13px] text-muted-foreground">Margen bruto</p>
          <p className="truncate text-xl font-bold" style={{ color: marginColor(metrics.margin) }}>
            {AppFormat.currency(metrics.margin)}
          </p>
        </div>
      </div>
    </PumaCard>
  )
}

const chartConfig = {
  diesel: { label: fuelInfo.diesel.displayName, color: fuelInfo.diesel.color },
  regular: { label: fuelInfo.regular.displayName, color: fuelInfo.regular.color },
  premium: { label: fuelInfo.premium.displayName, color: fuelInfo.premium.color },
} satisfies ChartConfig

/** Stacked bars of sales per period, split by fuel (SalesChartCard). */
export function SalesChartCard({
  buckets,
  fuels = [...FUELS],
  className,
}: {
  buckets: ChartBucket[]
  fuels?: FuelType[]
  className?: string
}) {
  const points = buckets.map((bucket) => ({ label: bucket.label, ...bucket.sales }))
  return (
    <PumaCard className={cn('flex flex-col gap-3', className)}>
      <CardHeader title="Ventas" trailing="Por combustible" />
      {buckets.length === 0 ? (
        <p className="text-[13px] text-muted-foreground">Sin datos en este periodo</p>
      ) : (
        <ChartContainer config={chartConfig} className="aspect-auto h-[230px] w-full">
          <BarChart data={points} margin={{ left: 0, right: 0, top: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} interval="preserveStartEnd" />
            <YAxis
              width={52}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: number) => AppFormat.compactCurrency(value)}
            />
            <ChartTooltip
              cursor={{ fill: 'var(--track)' }}
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <div className="flex w-full items-center gap-2">
                      <FuelDot fuel={name as FuelType} />
                      <span className="text-muted-foreground">{fuelInfo[name as FuelType].displayName}</span>
                      <span className="ml-auto font-mono font-medium tabular-nums">
                        {AppFormat.currency(Number(value), true)}
                      </span>
                    </div>
                  )}
                />
              }
            />
            {/* Keep the iOS order (Diésel, Regular, Súper) instead of sorting by name. */}
            <ChartLegend itemSorter={null} content={<ChartLegendContent className="justify-start" />} />
            {fuels.map((fuel, index) => (
              <Bar
                key={fuel}
                dataKey={fuel}
                stackId="sales"
                fill={`var(--color-${fuel})`}
                radius={index === fuels.length - 1 ? [3, 3, 0, 0] : 0}
              />
            ))}
          </BarChart>
        </ChartContainer>
      )}
    </PumaCard>
  )
}

export function FuelVolumeCard({
  title = 'Consumo por combustible',
  gallons,
  className,
}: {
  title?: string
  gallons: FuelRecord
  className?: string
}) {
  const maxValue = Math.max(...FUELS.map((fuel) => gallons[fuel]), 1)
  const total = FUELS.reduce((sum, fuel) => sum + gallons[fuel], 0)
  return (
    <PumaCard className={cn('flex flex-col gap-3.5', className)}>
      <CardHeader title={title} trailing={AppFormat.gallons(total)} />
      {FUELS.map((fuel) => (
        <div key={fuel} className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-[15px]">
            <FuelDot fuel={fuel} />
            <span>{fuelInfo[fuel].displayName}</span>
            <span className="ml-auto font-semibold">{AppFormat.gallons(gallons[fuel])}</span>
          </div>
          <ProgressBar ratio={gallons[fuel] / maxValue} color={fuelInfo[fuel].color} />
        </div>
      ))}
    </PumaCard>
  )
}

export function FuelSalesTableCard({
  metrics,
  fuels = [...FUELS],
  className,
}: {
  metrics: DashboardMetrics
  fuels?: FuelType[]
  className?: string
}) {
  return (
    <PumaCard className={cn('flex flex-col gap-3', className)}>
      <CardHeader title="Ventas por combustible" />
      <table className="w-full text-right text-[15px] tabular-nums">
        <thead className="text-xs text-muted-foreground">
          <tr className="border-b">
            <th className="py-2 text-left font-normal">Combustible</th>
            <th className="py-2 font-normal">Galones</th>
            <th className="py-2 font-normal">Ventas</th>
          </tr>
        </thead>
        <tbody>
          {fuels.map((fuel) => (
            <tr key={fuel}>
              <td className="py-2 text-left">
                <span className="inline-flex items-center gap-1.5">
                  <FuelDot fuel={fuel} />
                  {fuelInfo[fuel].displayName}
                </span>
              </td>
              <td className="py-2">{AppFormat.number(Math.round(metrics.gallons[fuel]))}</td>
              <td className="py-2">{AppFormat.currency(metrics.sales[fuel])}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t font-bold">
          <tr>
            <td className="py-2 text-left">Total</td>
            <td className="py-2">{AppFormat.number(Math.round(metrics.totalGallons))}</td>
            <td className="py-2">{AppFormat.currency(metrics.totalSales)}</td>
          </tr>
        </tfoot>
      </table>
    </PumaCard>
  )
}

export function BranchSalesTableCard({ rows, className }: { rows: BranchMetricRow[]; className?: string }) {
  const total = (pick: (row: BranchMetricRow) => number) => rows.reduce((sum, row) => sum + pick(row), 0)
  const totalMargin = total((row) => row.margin)
  return (
    <PumaCard className={cn('flex flex-col gap-3', className)}>
      <CardHeader title="Por sucursal" />
      <div className="overflow-x-auto">
        <table className="w-full text-right text-[13px] font-medium whitespace-nowrap tabular-nums">
          <thead className="text-xs text-muted-foreground">
            <tr className="border-b">
              <th className="py-2 pr-2 text-left font-normal">Sucursal</th>
              <th className="px-2 py-2 font-normal">Galones</th>
              <th className="px-2 py-2 font-normal">Ventas</th>
              <th className="py-2 pl-2 font-normal">Margen</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="py-2 pr-2 text-left">{row.name.replace('Puma ', '')}</td>
                <td className="px-2 py-2">{AppFormat.number(Math.round(row.totalGallons))}</td>
                <td className="px-2 py-2">{AppFormat.currency(row.totalSales)}</td>
                <td className="py-2 pl-2" style={{ color: marginColor(row.margin) }}>
                  {AppFormat.currency(row.margin)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t font-bold">
            <tr>
              <td className="py-2 pr-2 text-left">Total</td>
              <td className="px-2 py-2">{AppFormat.number(Math.round(total((row) => row.totalGallons)))}</td>
              <td className="px-2 py-2">{AppFormat.currency(total((row) => row.totalSales))}</td>
              <td className="py-2 pl-2" style={{ color: marginColor(totalMargin) }}>
                {AppFormat.currency(totalMargin)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </PumaCard>
  )
}
