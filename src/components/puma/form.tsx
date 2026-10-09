import type { ComponentProps, ReactNode } from 'react'
import type { FieldError } from 'react-hook-form'

import { cn } from '@/lib/utils'

// Rows of a grouped iOS form (Form + Section), shared by the branch and manager forms.

/** Classes of a borderless input inside a form row. */
export const INPUT_CLASS = 'h-11 min-w-0 bg-transparent text-[17px] outline-none placeholder:text-muted-foreground/70'

/** Full-width text field row of a grouped form. */
export function TextRow({ error, ...props }: ComponentProps<'input'> & { error?: FieldError }) {
  return (
    <div className="not-last:border-b">
      <input {...props} aria-invalid={Boolean(error)} className={cn(INPUT_CLASS, 'w-full')} />
      {error && <FieldMessage error={error} />}
    </div>
  )
}

/** "Label … control" row of a grouped form (LabeledContent). */
export function LabeledField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex min-h-11 items-center justify-between gap-3 text-[17px] not-last:border-b">
      <span className="shrink-0">{label}</span>
      {children}
    </label>
  )
}

export function FieldMessage({ error }: { error: FieldError }) {
  return (
    <p role="alert" className="pb-2 text-[13px] text-brand-red">
      {error.message}
    </p>
  )
}
