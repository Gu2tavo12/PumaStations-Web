import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { useSaveCatalogItem } from '@/api/catalog'
import { usePumaData } from '@/api/data'
import { FormSection, Segmented } from '@/components/puma/controls'
import { FieldMessage, INPUT_CLASS, LabeledField, TextRow } from '@/components/puma/form'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { CATALOG_CATEGORIES, catalogCategoryInfo, type CatalogCategory } from '@/domain/enums'
import type { CatalogItem } from '@/domain/models'
import { isCatalogNameTaken } from '@/domain/store'
import { roundTo } from '@/lib/format'
import { cn } from '@/lib/utils'

/** Same range as the Stepper of the iOS form. */
const MAX_MIN_STOCK = 200

const CATEGORY_OPTIONS = CATALOG_CATEGORIES.map((value) => ({ value, label: catalogCategoryInfo[value].displayName }))

/** Same rules as CatalogItemFormViewModel.save. The minimum stock only applies to products. */
const schema = z
  .object({
    category: z.enum(CATALOG_CATEGORIES),
    name: z.string().trim().min(1, 'Ingresa el nombre.'),
    detail: z.string().trim(),
    price: z.number({ error: 'El precio debe ser mayor que 0.' }).gt(0, 'El precio debe ser mayor que 0.'),
    // NaN when the field is empty; checked below only for products.
    minStock: z.union([z.number(), z.nan()]),
    isActive: z.boolean(),
  })
  .superRefine((values, context) => {
    if (!catalogCategoryInfo[values.category].tracksStock) return
    const issue = (message: string) => context.addIssue({ code: 'custom', path: ['minStock'], message })
    if (!Number.isFinite(values.minStock)) issue('Ingresa la existencia mínima.')
    else if (values.minStock < 0) issue('La existencia mínima no puede ser negativa.')
    else if (!Number.isInteger(values.minStock)) issue('La existencia mínima debe ser un número entero.')
    else if (values.minStock > MAX_MIN_STOCK) issue(`La existencia mínima no puede pasar de ${MAX_MIN_STOCK}.`)
  })

type FormValues = z.infer<typeof schema>

/** Create or edit a product or service of the franchise catalog (CatalogItemFormView). */
export function CatalogItemFormDialog({
  open,
  item,
  defaultCategory,
  onOpenChange,
}: {
  open: boolean
  /** null = new item. */
  item: CatalogItem | null
  /** Category of a new item (the tab that was open). */
  defaultCategory: CatalogCategory
  onOpenChange: (open: boolean) => void
}) {
  const { data } = usePumaData()
  const catalog = data!.catalog
  const saveItem = useSaveCatalogItem()
  const isEditing = item !== null

  const defaults = useMemo<FormValues>(
    () => ({
      category: item?.category ?? defaultCategory,
      name: item?.name ?? '',
      detail: item?.detail ?? '',
      price: item?.price ?? 0,
      minStock: item?.minStock ?? 6,
      isActive: item?.isActive ?? true,
    }),
    [item, defaultCategory],
  )

  const { register, handleSubmit, control, reset, setError, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  })
  const { errors, isSubmitting } = formState
  const category = useWatch({ control, name: 'category' })
  const tracksStock = catalogCategoryInfo[category].tracksStock
  const isService = category === 'service'

  useEffect(() => {
    if (open) reset(defaults)
  }, [open, defaults, reset])

  const onSubmit = handleSubmit(async (values) => {
    if (isCatalogNameTaken(catalog, values.name, item?.id)) {
      setError('name', { message: 'Ya existe un artículo con ese nombre.' })
      return
    }
    try {
      await saveItem.mutateAsync({
        id: item?.id ?? null,
        name: values.name,
        category: values.category,
        detail: values.detail,
        price: roundTo(values.price, 2),
        minStock: catalogCategoryInfo[values.category].tracksStock ? values.minStock : 0,
        isActive: isEditing ? values.isActive : true,
      })
      toast.success(isEditing ? 'Cambios guardados' : `Se agregó ${values.name} al catálogo`)
      onOpenChange(false)
    } catch (error) {
      toast.error('No se pudo guardar', { description: error instanceof Error ? error.message : String(error) })
    }
  })

  const title = isEditing
    ? isService
      ? 'Editar servicio'
      : 'Editar producto'
    : isService
      ? 'Nuevo servicio'
      : 'Nuevo producto'

  return (
    <Dialog open={open} onOpenChange={(next) => !isSubmitting && onOpenChange(next)}>
      <DialogContent className="flex max-h-[92svh] flex-col gap-0 bg-background p-0 sm:max-w-lg">
        <DialogHeader className="border-b bg-card px-4 py-3">
          <DialogTitle className="text-center text-[17px]">{title}</DialogTitle>
          <DialogDescription className="sr-only">Nombre, precio e inventario del artículo.</DialogDescription>
        </DialogHeader>

        <form id="catalog-form" onSubmit={onSubmit} noValidate className="flex flex-col gap-6 overflow-y-auto px-4 py-5">
          <FormSection title="Artículo" footer="La categoría no se puede cambiar después de crear el artículo.">
            {isEditing ? (
              <LabeledField label="Categoría">
                <span className="text-muted-foreground">{catalogCategoryInfo[category].displayName}</span>
              </LabeledField>
            ) : (
              <div className="py-2.5 not-last:border-b">
                <Controller
                  control={control}
                  name="category"
                  render={({ field }) => (
                    <Segmented label="Categoría" value={field.value} options={CATEGORY_OPTIONS} onChange={field.onChange} />
                  )}
                />
              </div>
            )}
            <TextRow placeholder="Nombre" autoComplete="off" error={errors.name} {...register('name')} />
            <TextRow
              placeholder={isService ? 'Qué incluye' : 'Presentación (ej. Botella 1 L)'}
              autoComplete="off"
              {...register('detail')}
            />
          </FormSection>

          <FormSection
            title="Precio e inventario"
            footer={
              tracksStock
                ? 'Una sucursal recibe el aviso de reabastecer cuando su existencia llega al mínimo.'
                : 'Los servicios no llevan inventario.'
            }
          >
            <LabeledField label="Precio">
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  aria-label="Precio"
                  aria-invalid={Boolean(errors.price)}
                  {...register('price', { valueAsNumber: true })}
                  className={cn(INPUT_CLASS, 'w-28 text-right')}
                />
                <span className="text-muted-foreground">USD</span>
              </div>
            </LabeledField>
            {errors.price && <FieldMessage error={errors.price} />}
            {tracksStock && (
              <>
                <LabeledField label="Existencia mínima">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={MAX_MIN_STOCK}
                      step={1}
                      aria-label="Existencia mínima"
                      aria-invalid={Boolean(errors.minStock)}
                      {...register('minStock', { valueAsNumber: true })}
                      className={cn(INPUT_CLASS, 'w-20 text-right')}
                    />
                    <span className="text-muted-foreground">uds.</span>
                  </div>
                </LabeledField>
                {errors.minStock && <FieldMessage error={errors.minStock} />}
              </>
            )}
          </FormSection>

          {isEditing && (
            <FormSection
              title="Disponibilidad"
              footer="Un artículo inactivo deja de aparecer en el punto de venta, pero conserva su historial."
            >
              <LabeledField label="Disponible para la venta">
                <Controller
                  control={control}
                  name="isActive"
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} aria-label="Disponible para la venta" />
                  )}
                />
              </LabeledField>
            </FormSection>
          )}
        </form>

        <DialogFooter className="m-0 flex-row gap-2 border-t bg-card px-4 py-3">
          <Button type="button" variant="ghost" className="flex-1 text-brand-green" disabled={isSubmitting} onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" form="catalog-form" className="flex-1 font-semibold" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="animate-spin" aria-label="Guardando" />
            ) : isEditing ? (
              'Guardar cambios'
            ) : (
              'Agregar al catálogo'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
