import { Building2, ChartColumn, CircleUserRound, Users, type LucideIcon } from 'lucide-react'

/** Sections of the general manager (the tabs of GeneralTabView in iOS). */
export const NAV_ITEMS: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: '/', label: 'Dashboard', icon: ChartColumn, end: true },
  { to: '/sucursales', label: 'Sucursales', icon: Building2 },
  { to: '/gerentes', label: 'Gerentes', icon: Users },
  { to: '/perfil', label: 'Perfil', icon: CircleUserRound },
]
