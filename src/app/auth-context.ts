import { createContext, useContext } from 'react'

import type { UserAccount } from '@/domain/models'

export type AuthState =
  | { status: 'loading'; user: null }
  | { status: 'signedOut'; user: null; message?: string }
  | { status: 'signedIn'; user: UserAccount }

export type AuthContextValue = AuthState & {
  /** Signs in and checks that the account is an active general manager; throws a readable message. */
  signIn: (email: string, password: string) => Promise<void>
  signOut: (message?: string) => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}

/** The signed-in general manager (only inside the protected routes). */
export function useCurrentUser(): UserAccount {
  const auth = useAuth()
  if (auth.status !== 'signedIn') throw new Error('useCurrentUser requires a signed-in user')
  return auth.user
}
