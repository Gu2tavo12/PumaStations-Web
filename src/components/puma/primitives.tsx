import type { LucideIcon } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'

import { tint } from '@/components/puma/tint'
import { cn } from '@/lib/utils'

// Small reusable pieces of Theme.swift. Colors are CSS values such as `var(--brand-green)`.

/** Card of the iOS app: 16 pt padding, 16 pt corners, no border (`cardStyle()`). */
export function PumaCard({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn('w-full rounded-card bg-card p-4 text-card-foreground', className)}>{children}</section>
}

/** Card title with an optional secondary text on the right (CardHeader). */
export function CardHeader({ title, trailing }: { title: string; trailing?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="text-[17px] font-semibold">{title}</h2>
      {trailing !== undefined && <span className="text-[13px] text-muted-foreground">{trailing}</span>}
    </div>
  )
}

export function Pill({
  text,
  color = 'var(--muted-foreground)',
  icon: Icon,
  className,
}: {
  text: string
  color?: string
  icon?: LucideIcon
  className?: string
}) {
  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap', className)}
      style={{ color, backgroundColor: tint(color) }}
    >
      {Icon && <Icon className="size-3" strokeWidth={2.5} />}
      {text}
    </span>
  )
}

export function IconSquare({
  icon: Icon,
  color = 'var(--brand-green)',
  size = 38,
}: {
  icon: LucideIcon
  color?: string
  size?: number
}) {
  const style: CSSProperties = { width: size, height: size, color, backgroundColor: tint(color) }
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-[10px]" style={style} aria-hidden>
      <Icon style={{ width: size * 0.47, height: size * 0.47 }} />
    </span>
  )
}

export function InitialsAvatar({ initials, size = 38 }: { initials: string; size?: number }) {
  const color = 'var(--brand-green)'
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold"
      style={{ width: size, height: size, fontSize: size * 0.37, color, backgroundColor: tint(color) }}
      aria-hidden
    >
      {initials}
    </span>
  )
}

/** iOS large navigation title, with optional actions on the right. */
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="flex items-end justify-between gap-4 pb-2">
      <div className="min-w-0">
        <h1 className="truncate text-[34px] leading-tight font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-[15px] text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  )
}

/** Row "label … value" of a grouped list (LabeledContent). */
export function LabeledRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 text-[17px] not-last:border-b">
      <span>{label}</span>
      <span className="truncate text-muted-foreground">{value}</span>
    </div>
  )
}
