import { useMutation, useQueryClient } from '@tanstack/react-query'

import { pumaDataKey } from '@/api/data'
import { useCurrentUser } from '@/app/auth-context'
import type { CatalogCategory } from '@/domain/enums'
import { requireSupabase } from '@/lib/supabase'

const UNIQUE_VIOLATION = '23505'

export type CatalogItemInput = {
  /** null = new item. */
  id: string | null
  name: string
  /** Only used when creating: the category is fixed afterwards (past sales and inventory depend on it). */
  category: CatalogCategory
  detail: string
  price: number
  minStock: number
  isActive: boolean
}

/**
 * Creates or edits a catalog item (CatalogItemFormViewModel.save). Only the general manager can write
 * the catalog (RLS). Items are never deleted: an inactive item keeps its sales and inventory history.
 */
export async function saveCatalogItem(input: CatalogItemInput): Promise<void> {
  const client = requireSupabase()
  const fields = {
    name: input.name,
    detail: input.detail,
    price: input.price,
    min_stock: input.minStock,
    is_active: input.isActive,
  }
  const { error } = input.id
    ? await client.from('catalog_items').update(fields).eq('id', input.id)
    : await client.from('catalog_items').insert({ ...fields, category: input.category })
  if (error) {
    if (error.code === UNIQUE_VIOLATION) throw new Error('Ya existe un artículo con ese nombre.')
    throw new Error(error.message)
  }
}

export function useSaveCatalogItem() {
  const queryClient = useQueryClient()
  const user = useCurrentUser()
  return useMutation({
    mutationFn: saveCatalogItem,
    onSettled: () => queryClient.invalidateQueries({ queryKey: pumaDataKey(user.id) }),
  })
}
