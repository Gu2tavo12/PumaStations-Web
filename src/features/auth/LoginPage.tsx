import { Loader2, Lock, Mail, TriangleAlert } from 'lucide-react'
import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'

import { useAuth } from '@/app/auth-context'
import { PumaCard } from '@/components/puma/primitives'
import { PumaLogo } from '@/components/puma/PumaLogo'
import { Button } from '@/components/ui/button'
import { env } from '@/lib/env'

/** Password of the demo accounts created by `supabase/seed.sql` (shown only in development). */
const DEMO_PASSWORD = 'Puma2026'

export function LoginPage() {
  const auth = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  if (auth.status === 'signedIn') {
    const from = (location.state as { from?: string } | null)?.from ?? '/'
    return <Navigate to={from} replace />
  }

  const canSubmit = email.trim() !== '' && password !== '' && !isLoading && env !== null
  const message = error ?? (auth.status === 'signedOut' ? auth.message : undefined)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!canSubmit) {
      setError('Ingresa tu correo y contraseña.')
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      await auth.signIn(email, password)
      setPassword('')
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : String(signInError))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-svh bg-background">
      <div className="mx-auto flex max-w-md flex-col gap-7 px-6 pt-14 pb-10 sm:pt-24">
        <header className="flex flex-col items-center gap-[18px] text-center">
          <PumaLogo className="h-16" />
          <div className="flex flex-col gap-1.5">
            <h1 className="text-[28px] leading-tight font-bold">Control de estaciones</h1>
            <p className="text-[17px] text-muted-foreground">Inicia sesión con tu cuenta de gerente general</p>
          </div>
        </header>

        {!env && (
          <PumaCard className="flex gap-2 text-sm text-warning-amber">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <span>
              Falta configurar Supabase: copia <code>.env.example</code> a <code>.env.local</code> y escribe la URL y la
              publishable key.
            </span>
          </PumaCard>
        )}

        <form className="flex flex-col gap-7" onSubmit={submit} noValidate>
          <div className="flex flex-col gap-3.5">
            <LabeledInput label="Correo electrónico" icon={<Mail />}>
              {(id) => (
                <input
                  id={id}
                  type="email"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="correo@puma.sv"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-full w-full bg-transparent text-[17px] outline-none placeholder:text-muted-foreground/70"
                />
              )}
            </LabeledInput>

            <LabeledInput label="Contraseña" icon={<Lock />}>
              {(id) => (
                <input
                  id={id}
                  type="password"
                  autoComplete="current-password"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-full w-full bg-transparent text-[17px] outline-none placeholder:text-muted-foreground/70"
                />
              )}
            </LabeledInput>

            {message && (
              <p role="alert" className="flex items-start gap-1.5 text-[13px] text-brand-red">
                <TriangleAlert className="mt-px size-4 shrink-0" />
                {message}
              </p>
            )}
          </div>

          <Button type="submit" disabled={!canSubmit} className="h-[52px] rounded-button text-[17px] font-semibold">
            {isLoading ? <Loader2 className="size-5 animate-spin" aria-label="Iniciando sesión" /> : 'Iniciar sesión'}
          </Button>
        </form>

        {import.meta.env.DEV && (
          <PumaCard className="flex flex-col gap-1.5 text-[13px] text-muted-foreground">
            <p className="font-semibold">Cuenta de prueba (contraseña: {DEMO_PASSWORD})</p>
            <p>Gerente general: gerente@puma.sv</p>
          </PumaCard>
        )}
      </div>
    </main>
  )
}

/** Text input with a caption above and an icon inside (LabeledInput in iOS). */
function LabeledInput({ label, icon, children }: { label: string; icon: ReactNode; children: (id: string) => ReactNode }) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="pl-1 text-[13px] text-muted-foreground">
        {label}
      </label>
      <div className="flex h-12 items-center gap-2.5 rounded-xl border border-border/70 bg-card px-3.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/25 [&_svg]:size-[18px] [&_svg]:shrink-0 [&_svg]:text-muted-foreground">
        {icon}
        {children(id)}
      </div>
    </div>
  )
}
