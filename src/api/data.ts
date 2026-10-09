import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@/app/auth-context'
import { buildGraph, type PumaRows } from '@/domain/mapping'
import type { PumaData } from '@/domain/models'
import type { Database } from '@/lib/database.types'
import { requireSupabase } from '@/lib/supabase'

type TableName = keyof Database['public']['Tables']

/** PostgREST returns at most 1000 rows per request. */
const PAGE_SIZE = 1_000

/** Reads every row the user is allowed to see, page by page (SupabaseClient.selectAll in iOS). */
async function selectAll<T extends TableName>(table: T): Promise<PumaRows[T]> {
  const client = requireSupabase()
  const rows: unknown[] = []
  for (;;) {
    const { data, error } = await client
      .from(table)
      .select('*')
      .order('id')
      .range(rows.length, rows.length + PAGE_SIZE - 1)
    if (error) throw new Error(error.message)
    rows.push(...data)
    if (data.length < PAGE_SIZE) return rows as PumaRows[T]
  }
}

/** Downloads every table and builds the in-memory graph (RemoteSync.signIn in iOS). */
export async function fetchPumaData(): Promise<PumaData> {
  const [profiles, branches, pumps, salesCuts, pumpSales, receptions, losses] = await Promise.all([
    selectAll('profiles'),
    selectAll('branches'),
    selectAll('pumps'),
    selectAll('sales_cuts'),
    selectAll('pump_sales'),
    selectAll('fuel_receptions'),
    selectAll('fuel_losses'),
  ])
  return buildGraph({
    profiles,
    branches,
    pumps,
    sales_cuts: salesCuts,
    pump_sales: pumpSales,
    fuel_receptions: receptions,
    fuel_losses: losses,
  })
}

export const pumaDataKey = (userId: string | undefined) => ['puma-data', userId] as const

/**
 * All the data of the general manager. Like iOS, it is downloaded once per session;
 * mutations invalidate it to reload.
 */
export function usePumaData() {
  const { user } = useAuth()
  return useQuery({
    queryKey: pumaDataKey(user?.id),
    queryFn: fetchPumaData,
    enabled: Boolean(user),
    staleTime: Infinity,
  })
}
