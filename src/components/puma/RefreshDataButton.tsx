import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

import { usePumaData } from '@/api/data'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Downloads the data again. The web loads it once per session (like iOS), so this shows changes
 * made from the iOS app without signing out. Errors are reported by DataBoundary.
 */
export function RefreshDataButton({ variant = 'icon' }: { variant?: 'icon' | 'row' }) {
  const { refetch, isFetching } = usePumaData()

  async function refresh() {
    const result = await refetch()
    if (result.isSuccess) toast.success('Datos actualizados')
  }

  if (variant === 'row') {
    return (
      <button
        type="button"
        onClick={refresh}
        disabled={isFetching}
        className="flex w-full items-center gap-2 rounded-card px-4 py-3 text-[17px] text-brand-green hover:bg-muted/60 disabled:opacity-60"
      >
        <RefreshCw className={cn('size-5', isFetching && 'animate-spin')} />
        {isFetching ? 'Actualizando…' : 'Actualizar datos'}
      </button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon-lg"
      className="text-brand-green"
      onClick={refresh}
      disabled={isFetching}
      aria-label="Actualizar datos"
      title="Actualizar datos"
    >
      <RefreshCw className={cn('size-5', isFetching && 'animate-spin')} />
    </Button>
  )
}
