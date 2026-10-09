import { Loader2 } from 'lucide-react'

/** Shown while the code of the first page is downloaded. */
export function PageFallback() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background">
      <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Cargando" />
    </div>
  )
}
