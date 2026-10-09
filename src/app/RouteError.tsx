import { TriangleAlert } from 'lucide-react'
import { isRouteErrorResponse, useRouteError } from 'react-router'

import { PumaCard } from '@/components/puma/primitives'
import { Button } from '@/components/ui/button'

/** Shown instead of React Router's developer screen when a page throws. */
export function RouteError() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : String(error)

  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-4">
      <PumaCard className="flex max-w-md flex-col gap-4">
        <div className="flex items-start gap-3 text-brand-red">
          <TriangleAlert className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-semibold">Algo salió mal</p>
            <p className="text-sm break-words">{message}</p>
          </div>
        </div>
        <Button onClick={() => window.location.assign('/')}>Volver al inicio</Button>
      </PumaCard>
    </main>
  )
}
