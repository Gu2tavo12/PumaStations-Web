import { AuthError } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import { AuthContext, type AuthState } from '@/app/auth-context'
import { mapUser } from '@/domain/mapping'
import type { UserAccount } from '@/domain/models'
import { requireSupabase, supabase } from '@/lib/supabase'

// Same messages as SupabaseError in the iOS app, plus the web-only role check.
const AuthMessages = {
  invalidCredentials: 'Correo o contraseña incorrectos.',
  inactiveAccount: 'Tu cuenta está desactivada. Contacta a la gerencia general.',
  profileNotFound: 'Tu usuario no tiene un perfil asignado. Contacta a la gerencia general.',
  notGeneralManager: 'La versión web es solo para el gerente general. Usa la app de iOS para gestionar tu sucursal.',
  sessionExpired: 'Tu sesión expiró. Inicia sesión de nuevo.',
} as const

class AccessDenied extends Error {}

/** Reads the profile of the user and checks that it may use the web version. */
async function loadGeneralManager(userId: string): Promise<UserAccount> {
  const { data, error } = await requireSupabase().from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new AccessDenied(AuthMessages.profileNotFound)
  if (!data.is_active) throw new AccessDenied(AuthMessages.inactiveAccount)
  if (data.role !== 'generalManager') throw new AccessDenied(AuthMessages.notGeneralManager)
  return mapUser(data)
}

function readableError(error: unknown): string {
  if (error instanceof AuthError) {
    if (error.code === 'invalid_credentials') return AuthMessages.invalidCredentials
    if (error.status === 0 || error.name === 'AuthRetryableFetchError') {
      return `No se pudo conectar con el servidor: ${error.message}`
    }
    return error.message
  }
  if (error instanceof TypeError) return `No se pudo conectar con el servidor: ${error.message}`
  return error instanceof Error ? error.message : String(error)
}

/** Supabase session + profile of the signed-in general manager. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [state, setState] = useState<AuthState>(() =>
    supabase ? { status: 'loading', user: null } : { status: 'signedOut', user: null },
  )

  const signOut = useCallback(
    async (message?: string) => {
      setState({ status: 'signedOut', user: null, message })
      queryClient.clear()
      await supabase?.auth.signOut()
    },
    [queryClient],
  )

  // Restores the saved session when the page loads.
  useEffect(() => {
    if (!supabase) return
    let cancelled = false
    supabase.auth.getSession().then(async ({ data }) => {
      const session = data.session
      if (!session) {
        if (!cancelled) setState({ status: 'signedOut', user: null })
        return
      }
      try {
        const user = await loadGeneralManager(session.user.id)
        if (!cancelled) setState({ status: 'signedIn', user })
      } catch (error) {
        if (!cancelled) await signOut(readableError(error))
      }
    })

    // Ends the session when it expires or is closed in another tab.
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        queryClient.clear()
        setState((current) => (current.status === 'signedOut' ? current : { status: 'signedOut', user: null }))
      }
    })
    return () => {
      cancelled = true
      data.subscription.unsubscribe()
    }
  }, [queryClient, signOut])

  const signIn = useCallback(async (email: string, password: string) => {
    const client = requireSupabase()
    const { data, error } = await client.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
    if (error) throw new Error(readableError(error))
    try {
      const user = await loadGeneralManager(data.user.id)
      setState({ status: 'signedIn', user })
    } catch (error) {
      await client.auth.signOut()
      throw new Error(readableError(error))
    }
  }, [])

  const value = useMemo(() => ({ ...state, signIn, signOut }), [state, signIn, signOut])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
