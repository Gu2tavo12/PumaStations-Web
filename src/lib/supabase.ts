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
