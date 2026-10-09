import { Droplet, ShoppingCart, Wrench, type LucideIcon } from 'lucide-react'

import type { CatalogCategory } from '@/domain/enums'

/** SF Symbols of CatalogCategory: cart, drop.triangle and wrench.and.screwdriver. */
export const categoryIcon: Record<CatalogCategory, LucideIcon> = {
  convenience: ShoppingCart,
  lubricant: Droplet,
  service: Wrench,
}
