import { useMutation, useQueryClient } from '@tanstack/react-query'

import { pumaDataKey } from '@/api/data'
import { useCurrentUser } from '@/app/auth-context'
import { requireSupabase } from '@/lib/supabase'

export type ManagerInput = {
  /** Existing manager id, or a new UUID for a new account. */
  id: string
  firstName: string
  lastName: string
  dui: string
  phone: string
  email: string
  /** Empty keeps the current password (only when editing). */
  password: string
  isActive: boolean
  branchId: string | null
}

/** Readable message for the errors raised by save_manager and the unique indexes. */
function readableError(error: { code?: string; message: string }): string {
  const message = error.message.toLowerCase()
  if (error.code === '23505') {
    if (message.includes('branch')) return 'Esa sucursal ya tiene un gerente vinculado.'
    if (message.includes('email') || message.includes('users')) return 'Ese correo ya está registrado.'
  }
  // save_manager already raises Spanish messages (42501, 22023).
  return error.message
}

/** Creates or edits a branch manager through the `save_manager` database function (general manager only). */
export async function saveManager(input: ManagerInput): Promise<void> {
  const { error } = await requireSupabase().rpc('save_manager', {
    p_id: input.id,
    p_email: input.email,
    p_password: input.password,
    p_first_name: input.firstName,
    p_last_name: input.lastName,
    p_dui: input.dui,
    p_phone: input.phone,
    p_is_active: input.isActive,
    p_branch_id: input.branchId,
  })
  if (error) throw new Error(readableError(error))
}

export function useSaveManager() {
  const queryClient = useQueryClient()
  const user = useCurrentUser()
  return useMutation({
    mutationFn: saveManager,
    onSettled: () => queryClient.invalidateQueries({ queryKey: pumaDataKey(user.id) }),
  })
}
