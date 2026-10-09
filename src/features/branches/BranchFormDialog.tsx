import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'

import { useCreateBranch } from '@/api/branches'
import { usePumaData } from '@/api/data'
import { FormSection } from '@/components/puma/controls'
import { FieldMessage, INPUT_CLASS, LabeledField, TextRow } from '@/components/puma/form'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { branchManagers, fullName } from '@/domain/cut'
import { BusinessRules, FUELS, fuelInfo } from '@/domain/enums'
import { cn } from '@/lib/utils'

const NO_MANAGER = 'none'

const capacity = z.number({ error: 'La capacidad de cada tanque debe ser mayor que 0.' }).gt(0, 'La capacidad de cada tanque debe ser mayor que 0.')

// Same validations and messages as BranchFormViewModel.
const schema = z.object({
  name: z.string().trim().min(1, 'Ingresa el nombre de la sucursal.'),
  code: z.string().trim(),
  address: z.string().trim().min(1, 'Ingresa la dirección y el municipio.'),
  municipality: z.string().trim().min(1, 'Ingresa la dirección y el municipio.'),
  phone: z.string().trim(),
  capacity: z.object({ diesel: capacity, regular: capacity, premium: capacity }),
  managerId: z.string(),
})

type FormValues = z.infer<typeof schema>

/** New branch form (BranchFormView): creates the 6 pumps and optionally links a free manager. */
export function BranchFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data } = usePumaData()
  const { branches, users } = data!
  const createBranch = useCreateBranch()
  const navigate = useNavigate()

  // Only active managers without a branch can be linked.
  const availableManagers = useMemo(
    () => branchManagers(users).filter((manager) => manager.branchId === null && manager.isActive),
    [users],
  )

  const defaults = useMemo<FormValues>(
    () => ({
      name: '',
      code: `SUC-${String(branches.length + 1).padStart(3, '0')}`,
      address: '',
      municipality: '',
      phone: '',
      capacity: { diesel: 10_000, regular: 12_000, premium: 8_000 },
      managerId: NO_MANAGER,
    }),
    [branches.length],
  )

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: defaults })
  const { register, handleSubmit, control, reset, setError, formState } = form
  const { errors } = formState

  useEffect(() => {
    if (open) reset(defaults)
  }, [open, defaults, reset])

  const onSubmit = handleSubmit(async (values) => {
    const nameTaken = branches.some((branch) => branch.name.localeCompare(values.name, 'es', { sensitivity: 'accent' }) === 0)
    if (nameTaken) {
      setError('name', { message: 'Ya existe una sucursal con ese nombre.' })
      return
    }
    try {
      const id = await createBranch.mutateAsync({
        name: values.name,
        code: values.code,
        address: values.address,
        municipality: values.municipality,
        phone: values.phone,
        capacity: values.capacity,
        manager: availableManagers.find((manager) => manager.id === values.managerId) ?? null,
      })
      toast.success(`Se creó ${values.name}`)
      onOpenChange(false)
      navigate(`/sucursales/${id}`)
    } catch (error) {
      toast.error('No se pudo guardar', { description: error instanceof Error ? error.message : String(error) })
    }
  })

  const isSaving = formState.isSubmitting
  const capacityError = errors.capacity?.diesel ?? errors.capacity?.regular ?? errors.capacity?.premium

  return (
    <Dialog open={open} onOpenChange={(next) => !isSaving && onOpenChange(next)}>
      <DialogContent className="flex max-h-[92svh] flex-col gap-0 bg-background p-0 sm:max-w-lg">
        <DialogHeader className="border-b bg-card px-4 py-3">
          <DialogTitle className="text-center text-[17px]">Nueva sucursal</DialogTitle>
          <DialogDescription className="sr-only">Datos de la estación, capacidad de tanques y gerente.</DialogDescription>
        </DialogHeader>

        <form id="branch-form" onSubmit={onSubmit} noValidate className="flex flex-col gap-6 overflow-y-auto px-4 py-5">
          <FormSection title="Datos generales">
            <TextRow placeholder="Nombre (ej. Puma Merliot)" error={errors.name} {...register('name')} autoFocus />
            <LabeledField label="Código">
              <input {...register('code')} placeholder="SUC-000" className={cn(INPUT_CLASS, 'text-right')} />
            </LabeledField>
            <TextRow placeholder="Dirección" error={errors.address} {...register('address')} />
            <TextRow placeholder="Municipio" error={errors.municipality} {...register('municipality')} />
            <TextRow placeholder="Teléfono" type="tel" {...register('phone')} />
          </FormSection>

          <FormSection
            title="Capacidad de tanques"
            footer="La existencia inicial es 0 gal. Sube con cada recepción y baja con las ventas y pérdidas de cada corte."
          >
            {FUELS.map((fuel) => (
              <LabeledField key={fuel} label={fuelInfo[fuel].displayName}>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="any"
                    aria-label={`Capacidad ${fuelInfo[fuel].displayName}`}
                    {...register(`capacity.${fuel}`, { valueAsNumber: true })}
                    className={cn(INPUT_CLASS, 'w-28 text-right')}
                  />
                  <span className="text-muted-foreground">gal</span>
                </div>
              </LabeledField>
            ))}
            {capacityError && <FieldMessage error={capacityError} />}
          </FormSection>

          <FormSection
            title="Bombas"
            footer={`Se crean automáticamente las bombas 1 a ${BusinessRules.pumpsPerBranch}. Cada una despacha Diésel, Regular y Súper.`}
          >
            <LabeledField label="Bombas">
              <span className="text-muted-foreground">{BusinessRules.pumpsPerBranch} (fijo)</span>
            </LabeledField>
          </FormSection>

          <FormSection
            title="Gerente de sucursal"
            footer="Solo aparecen gerentes sin sucursal. También puedes vincularlo después desde Gerentes."
          >
            <LabeledField label="Gerente">
              <Controller
                control={control}
                name="managerId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-8 border-0 bg-transparent px-0 text-[17px] text-muted-foreground shadow-none focus-visible:ring-0 dark:bg-transparent">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="end">
                      <SelectItem value={NO_MANAGER}>Sin vincular</SelectItem>
                      {availableManagers.map((manager) => (
                        <SelectItem key={manager.id} value={manager.id}>
                          {fullName(manager)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </LabeledField>
          </FormSection>
        </form>

        <DialogFooter className="m-0 flex-row gap-2 border-t bg-card px-4 py-3">
          <Button type="button" variant="ghost" className="flex-1 text-brand-green" disabled={isSaving} onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" form="branch-form" className="flex-1 font-semibold" disabled={isSaving}>
            {isSaving ? <Loader2 className="animate-spin" aria-label="Guardando" /> : 'Crear sucursal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
