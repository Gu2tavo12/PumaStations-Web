import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/lib/database.types'
import { env } from '@/lib/env'

export type PumaClient = SupabaseClient<Database>

/**
 * Supabase client shared by the whole app (auth + PostgREST + RPC).
 * Security lives in the database (RLS), the same policies used by the iOS app.
 */
export const supabase: PumaClient | null = env
  ? createClient<Database>(env.supabaseUrl, env.supabasePublishableKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null

/** Client for code that only runs once Supabase is configured (after sign in). */
export function requireSupabase(): PumaClient {
  if (!supabase) throw new Error('Falta configurar Supabase. Crea el archivo .env.local como indica el README.')
  return supabase
}
