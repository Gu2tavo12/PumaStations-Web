import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Loader2 } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { usePumaData } from '@/api/data'
import { useSaveManager } from '@/api/managers'
import { FormSection } from '@/components/puma/controls'
import { FieldMessage, LabeledField, TextRow } from '@/components/puma/form'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { branchManagers, fullName } from '@/domain/cut'
import { roleDisplayName } from '@/domain/enums'
import type { UserAccount } from '@/domain/models'
import { cn } from '@/lib/utils'

const MIN_PASSWORD = 6

const baseSchema = z.object({
  firstName: z.string().trim().min(1, 'Ingresa nombre y apellidos.'),
  lastName: z.string().trim().min(1, 'Ingresa nombre y apellidos.'),
  dui: z.string().trim(),
  phone: z.string().trim(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .refine((value) => value.includes('@') && value.includes('.'), 'Ingresa un correo válido.'),
  password: z.string(),
  isActive: z.boolean(),
  branchId: z.string().nullable(),
})

type FormValues = z.infer<typeof baseSchema>

/** Same rules as ManagerFormViewModel.save: the password is required for new accounts, optional when editing. */
function makeSchema(isEditing: boolean) {
  return baseSchema.superRefine((values, context) => {
    if ((!isEditing || values.password !== '') && values.password.length < MIN_PASSWORD) {
      context.addIssue({
        code: 'custom',
        path: ['password'],
        message: `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`,
      })
    }
  })
}

/** Create or edit a branch manager and link a branch (ManagerFormView). */
export function ManagerFormDialog({
  open,
  manager,
  onOpenChange,
}: {
  open: boolean
  /** null = new manager. */
  manager: UserAccount | null
  onOpenChange: (open: boolean) => void
}) {
  const { data } = usePumaData()
  const { branches, users } = data!
  const saveManager = useSaveManager()
  const isEditing = manager !== null

  // Branches linked to another manager can't be picked (each branch has one manager).
  const linkedNames = useMemo(() => {
    const names = new Map<string, string>()
    for (const other of branchManagers(users)) {
      if (other.branchId && other.id !== manager?.id) names.set(other.branchId, fullName(other))
    }
    return names
  }, [users, manager])

  const defaults = useMemo<FormValues>(
    () => ({
      firstName: manager?.firstName ?? '',
      lastName: manager?.lastName ?? '',
      dui: manager?.dui ?? '',
      phone: manager?.phone ?? '',
      email: manager?.email ?? '',
      password: '',
      isActive: manager?.isActive ?? true,
      branchId: manager?.branchId ?? null,
    }),
    [manager],
  )

  const schema = useMemo(() => makeSchema(isEditing), [isEditing])
  const { register, handleSubmit, control, reset, setError, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  })
  const { errors, isSubmitting } = formState

  useEffect(() => {
    if (open) reset(defaults)
  }, [open, defaults, reset])

  const onSubmit = handleSubmit(async (values) => {
    const emailTaken = users.some((user) => user.email === values.email && user.id !== manager?.id)
    if (emailTaken) {
      setError('email', { message: 'Ese correo ya está registrado.' })
      return
    }
    if (values.branchId && linkedNames.has(values.branchId)) {
      setError('branchId', { message: 'Esa sucursal ya tiene un gerente vinculado.' })
      return
    }
    try {
      await saveManager.mutateAsync({
        id: manager?.id ?? crypto.randomUUID(),
        firstName: values.firstName,
        lastName: values.lastName,
        dui: values.dui,
        phone: values.phone,
        email: values.email,
        password: values.password,
        isActive: values.isActive,
        branchId: values.branchId,
      })
      toast.success(isEditing ? 'Cambios guardados' : `Se creó la cuenta de ${values.firstName} ${values.lastName}`)
      onOpenChange(false)
    } catch (error) {
      toast.error('No se pudo guardar', { description: error instanceof Error ? error.message : String(error) })
    }
  })

  const nameError = errors.firstName ?? errors.lastName

  return (
    <Dialog open={open} onOpenChange={(next) => !isSubmitting && onOpenChange(next)}>
      <DialogContent className="flex max-h-[92svh] flex-col gap-0 bg-background p-0 sm:max-w-lg">
        <DialogHeader className="border-b bg-card px-4 py-3">
          <DialogTitle className="text-center text-[17px]">{isEditing ? 'Editar gerente' : 'Nuevo gerente'}</DialogTitle>
          <DialogDescription className="sr-only">Datos, acceso y sucursal del gerente.</DialogDescription>
        </DialogHeader>

        <form id="manager-form" onSubmit={onSubmit} noValidate className="flex flex-col gap-6 overflow-y-auto px-4 py-5">
          <FormSection title="Datos del gerente">
            <TextRow placeholder="Nombre" autoComplete="off" {...register('firstName')} />
            <TextRow placeholder="Apellidos" autoComplete="off" {...register('lastName')} />
            <TextRow placeholder="DUI (00000000-0)" inputMode="numeric" autoComplete="off" {...register('dui')} />
            <TextRow placeholder="Teléfono" type="tel" autoComplete="off" {...register('phone')} />
            {nameError && <FieldMessage error={nameError} />}
          </FormSection>

          <FormSection
            title="Acceso"
            footer={`Mínimo ${MIN_PASSWORD} caracteres. El gerente solo verá y registrará datos de la sucursal vinculada.`}
          >
            <TextRow
              placeholder="Correo"
              type="email"
              autoCapitalize="none"
              spellCheck={false}
              autoComplete="off"
              error={errors.email}
              {...register('email')}
            />
            <TextRow
              placeholder={isEditing ? 'Nueva contraseña (opcional)' : 'Contraseña temporal'}
              type="password"
              autoComplete="new-password"
              error={errors.password}
              {...register('password')}
            />
            <LabeledField label="Rol">
              <span className="text-muted-foreground">{roleDisplayName.branchManager}</span>
            </LabeledField>
            {isEditing && (
              <LabeledField label="Cuenta activa">
                <Controller
                  control={control}
                  name="isActive"
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} aria-label="Cuenta activa" />
                  )}
                />
              </LabeledField>
            )}
          </FormSection>

          <FormSection title="Vincular sucursal">
            <Controller
              control={control}
              name="branchId"
              render={({ field }) => (
                <div role="radiogroup" aria-label="Sucursal">
                  <BranchOption label="Sin sucursal" selected={field.value === null} onSelect={() => field.onChange(null)} />
                  {branches.map((branch) => {
                    const linkedTo = linkedNames.get(branch.id)
                    return (
                      <BranchOption
                        key={branch.id}
                        label={branch.name}
                        detail={linkedTo ? `Vinculada a ${linkedTo}` : 'Disponible'}
                        disabled={linkedTo !== undefined}
                        selected={field.value === branch.id}
                        onSelect={() => field.onChange(branch.id)}
                      />
                    )
                  })}
                </div>
              )}
            />
            {errors.branchId && <FieldMessage error={errors.branchId} />}
          </FormSection>
        </form>

        <DialogFooter className="m-0 flex-row gap-2 border-t bg-card px-4 py-3">
          <Button type="button" variant="ghost" className="flex-1 text-brand-green" disabled={isSubmitting} onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" form="manager-form" className="flex-1 font-semibold" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="animate-spin" aria-label="Guardando" />
            ) : isEditing ? (
              'Guardar cambios'
            ) : (
              'Crear y vincular'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function BranchOption({
  label,
  detail,
  selected,
  disabled = false,
  onSelect,
}: {
  label: string
  detail?: string
  selected: boolean
  disabled?: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'flex w-full items-center justify-between gap-3 py-2.5 text-left not-last:border-b',
        disabled && 'cursor-not-allowed opacity-45',
      )}
    >
      <span className="flex min-w-0 flex-col">
        <span className="text-[17px]">{label}</span>
        {detail && <span className="text-xs text-muted-foreground">{detail}</span>}
      </span>
      {selected && <Check className="size-5 shrink-0 text-brand-green" strokeWidth={2.5} />}
    </button>
  )
}
