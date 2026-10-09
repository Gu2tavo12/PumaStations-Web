import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { CardHeader, PumaCard } from '@/components/puma/primitives'
import { FuelDot } from '@/components/puma/tanks'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import type { ChartBucket } from '@/domain/dashboard'
import { FUELS, fuelInfo, type FuelType } from '@/domain/enums'
import { AppFormat } from '@/lib/format'
import { cn } from '@/lib/utils'

// Kept apart from sales.tsx so only the dashboard downloads Recharts.

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
