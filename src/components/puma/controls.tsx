import { ChevronDown, Search, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

// Controls with the look of the iOS app: segmented picker, filter chips and search field.

/** iOS segmented picker (`.pickerStyle(.segmented)`). */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  className,
}: {
  value: T
  options: readonly { value: T; label: string }[]
  onChange: (value: T) => void
  label: string
  className?: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn('flex w-full rounded-[9px] bg-track p-0.5', className)}>
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'h-7 flex-1 rounded-[7px] px-2 text-[13px] font-medium whitespace-nowrap transition-colors',
              selected ? 'bg-card shadow-sm dark:bg-[#636366]' : 'text-foreground/80 hover:text-foreground',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

/** Rounded chip that opens the filters (FilterChip). */
export function FilterChip({
  icon: Icon,
  text,
  highlighted = false,
  onClick,
}: {
  icon: LucideIcon
  text: string
  highlighted?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-9 max-w-full shrink-0 items-center gap-1.5 rounded-full px-3 text-[15px] font-medium',
        highlighted ? 'bg-brand-green text-white' : 'bg-card text-foreground',
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{text}</span>
      <ChevronDown className="size-3.5 shrink-0" strokeWidth={3} />
    </button>
  )
}

/** iOS search field (`.searchable`). */
export function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <label className="flex h-9 w-full items-center gap-1.5 rounded-[10px] bg-track px-2 text-muted-foreground">
      <Search className="size-4 shrink-0" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-full w-full bg-transparent text-[17px] text-foreground outline-none placeholder:text-muted-foreground"
      />
    </label>
  )
}

/** Caption under a group of rows (Section footer). */
export function SectionFooter({ children }: { children: ReactNode }) {
  return <p className="px-4 pt-2 text-[13px] text-muted-foreground">{children}</p>
}

/** Grouped section of an iOS form: caption + white rounded block. */
export function FormSection({ title, footer, children }: { title: string; footer?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="px-4 text-[13px] text-muted-foreground uppercase">{title}</h3>
      <div className="rounded-card bg-card px-4">{children}</div>
      {footer && <p className="px-4 text-[13px] text-muted-foreground">{footer}</p>}
    </section>
  )
}
