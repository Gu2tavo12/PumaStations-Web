import { cn } from '@/lib/utils'

/** Puma Energy logo. In dark mode it sits on a white plate so "ENERGY" stays readable. */
export function PumaLogo({ className }: { className?: string }) {
  return (
    <div className={cn('inline-flex rounded-xl dark:bg-white dark:px-3 dark:py-2', className)}>
      <img src="/puma-logo.png" alt="Puma Energy" className="h-full w-auto" />
    </div>
  )
}
