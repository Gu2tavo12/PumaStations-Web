import { CheckCircle2, Moon, Sun, TriangleAlert } from 'lucide-react'

import { useTheme } from '@/app/theme-context'
import { PumaLogo } from '@/components/puma/PumaLogo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { env } from '@/lib/env'

const swatches = [
  { name: 'Regular · brandGreen', className: 'bg-brand-green' },
  { name: 'Súper · brandRed', className: 'bg-brand-red' },
  { name: 'Diésel · dieselGray', className: 'bg-diesel-gray' },
  { name: 'Medio · warningAmber', className: 'bg-warning-amber' },
]

/** Temporary screen of phase 0: checks the setup (Supabase env + brand tokens). */
export function SetupPage() {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col gap-6 px-4 py-14">
      <div className="flex flex-col items-center gap-4 text-center">
        <PumaLogo className="h-16" />
        <div>
          <h1 className="text-3xl font-bold">Control de estaciones</h1>
          <p className="text-muted-foreground">Versión web · Gerente general</p>
        </div>
      </div>

      <Card className="rounded-card">
        <CardHeader>
          <CardTitle>Configuración</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          {env ? (
            <p className="flex items-center gap-2 text-brand-green">
              <CheckCircle2 className="size-4" /> Supabase configurado ({new URL(env.supabaseUrl).host})
            </p>
          ) : (
            <p className="flex items-start gap-2 text-warning-amber">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
              <span>
                Falta <code>.env.local</code>: copia <code>.env.example</code> y escribe la URL y la publishable key.
              </span>
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            {swatches.map((swatch) => (
              <div key={swatch.name} className="flex items-center gap-2">
                <span className={`size-4 rounded-full ${swatch.className}`} />
                <span className="text-muted-foreground">{swatch.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button className="h-13 flex-1 rounded-button text-base font-semibold">Iniciar sesión</Button>
        <Button
          variant="outline"
          className="h-13 rounded-button"
          aria-label="Cambiar tema"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
        >
          {isDark ? <Sun /> : <Moon />}
        </Button>
      </div>
    </main>
  )
}
