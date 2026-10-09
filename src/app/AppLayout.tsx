import { Loader2, LogOut, RefreshCw, TriangleAlert } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { NavLink, Navigate, Outlet, useLocation } from 'react-router'
import { toast } from 'sonner'

import { usePumaData } from '@/api/data'
import { useAuth, useCurrentUser } from '@/app/auth-context'
import { NAV_ITEMS } from '@/app/navigation'
import { InitialsAvatar, PumaCard } from '@/components/puma/primitives'
import { PumaLogo } from '@/components/puma/PumaLogo'
import { Button } from '@/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { fullName, initials } from '@/domain/cut'
import { roleDisplayName } from '@/domain/enums'
import { cn } from '@/lib/utils'

/** Protected routes: only an active general manager gets past this point. */
export function RequireAuth() {
  const auth = useAuth()
  const location = useLocation()

  if (auth.status === 'loading') {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Cargando" />
      </div>
    )
  }
  if (auth.status === 'signedOut') {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  return <AppLayout />
}

function AppLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0 bg-background">
        <div className="sticky top-0 z-10 hidden h-12 items-center bg-background/80 px-3 backdrop-blur md:flex">
          <SidebarTrigger />
        </div>
        <div className="mx-auto w-full max-w-6xl px-4 pt-5 pb-28 md:px-8 md:pt-2 md:pb-12">
          <DataBoundary>
            <Outlet />
          </DataBoundary>
        </div>
      </SidebarInset>
      <BottomTabBar />
    </SidebarProvider>
  )
}

function AppSidebar() {
  const user = useCurrentUser()
  const location = useLocation()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 pt-4 pb-2 group-data-[collapsible=icon]:hidden">
        <PumaLogo className="h-10 self-start" />
        <p className="pt-1 text-xs text-muted-foreground">Control de estaciones</p>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const isActive = item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label} size="lg" className="text-[15px]">
                      <NavLink to={item.to} end={item.end}>
                        <item.icon />
                        <span>{item.label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="Perfil">
              <NavLink to="/perfil">
                <InitialsAvatar initials={initials(user)} size={32} />
                <span className="flex min-w-0 flex-col leading-tight">
                  <span className="truncate font-medium">{fullName(user)}</span>
                  <span className="truncate text-xs text-muted-foreground">{roleDisplayName[user.role]}</span>
                </span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

/** iOS-style tab bar for phones. */
function BottomTabBar() {
  return (
    <nav
      aria-label="Secciones"
      className="fixed inset-x-0 bottom-0 z-20 border-t bg-card/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
    >
      <ul className="grid grid-cols-4">
        {NAV_ITEMS.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-0.5 pt-2 pb-1.5 text-[10px] font-medium',
                  isActive ? 'text-brand-green' : 'text-muted-foreground',
                )
              }
            >
              <item.icon className="size-6" />
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/** Downloads the data once per session; shows the iOS "No se pudo sincronizar" state on failure. */
function DataBoundary({ children }: { children: ReactNode }) {
  const { data, isPending, error, refetch, isRefetching } = usePumaData()
  const { signOut } = useAuth()

  // A failed background reload keeps showing the data already downloaded.
  useEffect(() => {
    if (error && data) toast.error('No se pudo actualizar', { description: error.message })
  }, [error, data])

  if (isPending) {
    return (
      <div className="flex min-h-[50svh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
        <p className="text-sm">Descargando datos…</p>
      </div>
    )
  }

  if (error && !data) {
    return (
      <PumaCard className="mx-auto mt-10 flex max-w-md flex-col gap-4">
        <div className="flex items-start gap-3 text-brand-red">
          <TriangleAlert className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-semibold">No se pudo sincronizar</p>
            <p className="text-sm">{error.message}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => refetch()} disabled={isRefetching} className="flex-1">
            <RefreshCw className={cn(isRefetching && 'animate-spin')} /> Reintentar
          </Button>
          <Button variant="outline" onClick={() => signOut()} className="flex-1 text-brand-red">
            <LogOut /> Cerrar sesión
          </Button>
        </div>
      </PumaCard>
    )
  }

  return children
}
