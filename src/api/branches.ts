import { useMutation, useQueryClient } from '@tanstack/react-query'

import { pumaDataKey } from '@/api/data'
import { useCurrentUser } from '@/app/auth-context'
import { BusinessRules, type FuelRecord } from '@/domain/enums'
import type { UserAccount } from '@/domain/models'
import { requireSupabase } from '@/lib/supabase'

export type NewBranch = {
  name: string
  code: string
  address: string
  municipality: string
  phone: string
  capacity: FuelRecord
  /** Branch manager without branch to link (optional). */
  manager: UserAccount | null
}

/** Postgres unique violation (branches_name_key, profiles_branch_key). */
const UNIQUE_VIOLATION = '23505'

/**
 * Creates the branch with its 6 pumps and links the manager, like BranchFormViewModel.save + RemoteSync.
 * The steps are separate requests: if the pumps fail the branch is deleted again so it is not left half-created.
 */
export async function createBranch(input: NewBranch): Promise<string> {
  const client = requireSupabase()
  const id = crypto.randomUUID()

  const { error: branchError } = await client.from('branches').insert({
    id,
    name: input.name,
    code: input.code,
    address: input.address,
    municipality: input.municipality,
    phone: input.phone,
    diesel_capacity: input.capacity.diesel,
    regular_capacity: input.capacity.regular,
    premium_capacity: input.capacity.premium,
  })
  if (branchError) {
    if (branchError.code === UNIQUE_VIOLATION) throw new Error('Ya existe una sucursal con ese nombre.')
    throw new Error(branchError.message)
  }

  const pumps = Array.from({ length: BusinessRules.pumpsPerBranch }, (_, index) => ({ branch_id: id, number: index + 1 }))
  const { error: pumpsError } = await client.from('pumps').insert(pumps)
  if (pumpsError) {
    await client.from('branches').delete().eq('id', id)
    throw new Error(`No se pudieron crear las bombas: ${pumpsError.message}`)
  }

  if (input.manager) {
    const manager = input.manager
    const { error: linkError } = await client.rpc('save_manager', {
      p_id: manager.id,
      p_email: manager.email,
      // Empty keeps the current password.
      p_password: '',
      p_first_name: manager.firstName,
      p_last_name: manager.lastName,
      p_dui: manager.dui,
      p_phone: manager.phone,
      p_is_active: manager.isActive,
      p_branch_id: id,
    })
    if (linkError) {
      throw new Error(`La sucursal se creó, pero no se pudo vincular al gerente: ${linkError.message}`)
    }
  }
  return id
}

export function useCreateBranch() {
  const queryClient = useQueryClient()
  const user = useCurrentUser()
  return useMutation({
    mutationFn: createBranch,
    // Reload even after a partial failure (e.g. branch created but manager not linked).
    onSettled: () => queryClient.invalidateQueries({ queryKey: pumaDataKey(user.id) }),
  })
}
