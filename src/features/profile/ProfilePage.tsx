import { LogOut, Monitor, Moon, Sun } from 'lucide-react'

import { useAuth, useCurrentUser } from '@/app/auth-context'
import { useTheme, type Theme } from '@/app/theme-context'
import { InitialsAvatar, LabeledRow, PageHeader, PumaCard } from '@/components/puma/primitives'
import { RefreshDataButton } from '@/components/puma/RefreshDataButton'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { fullName, initials } from '@/domain/cut'
import { roleDisplayName } from '@/domain/enums'

/** Profile of the general manager (ProfileView in iOS) plus the appearance setting of the web. */
export function ProfilePage() {
  const user = useCurrentUser()
  const { signOut } = useAuth()
  const { theme, setTheme } = useTheme()

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <PageHeader title="Perfil" />

      <PumaCard className="flex items-center gap-3.5">
        <InitialsAvatar initials={initials(user)} size={56} />
        <div className="min-w-0">
          <p className="text-[17px] font-semibold">{fullName(user)}</p>
          <p className="text-[15px] text-muted-foreground">{roleDisplayName[user.role]}</p>
          <p className="truncate text-[13px] text-muted-foreground">{user.email}</p>
        </div>
      </PumaCard>

      <section className="flex flex-col gap-2">
        <h2 className="px-4 text-[13px] text-muted-foreground uppercase">Datos</h2>
        <PumaCard className="py-0">
          <LabeledRow label="DUI" value={user.dui || '—'} />
          <LabeledRow label="Teléfono" value={user.phone || '—'} />
        </PumaCard>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="px-4 text-[13px] text-muted-foreground uppercase">Apariencia</h2>
        <PumaCard>
          <ToggleGroup
            type="single"
            variant="outline"
            value={theme}
            onValueChange={(value) => value && setTheme(value as Theme)}
            className="w-full"
            aria-label="Tema"
          >
            <ToggleGroupItem value="system" className="flex-1">
              <Monitor /> Sistema
            </ToggleGroupItem>
            <ToggleGroupItem value="light" className="flex-1">
              <Sun /> Claro
            </ToggleGroupItem>
            <ToggleGroupItem value="dark" className="flex-1">
              <Moon /> Oscuro
            </ToggleGroupItem>
          </ToggleGroup>
        </PumaCard>
      </section>

      <PumaCard className="p-0">
        <RefreshDataButton variant="row" />
      </PumaCard>

      <PumaCard className="p-0">
        <button
          type="button"
          onClick={() => signOut()}
          className="flex w-full items-center gap-2 rounded-card px-4 py-3 text-[17px] text-brand-red hover:bg-muted/60"
        >
          <LogOut className="size-5" /> Cerrar sesión
        </button>
      </PumaCard>
    </div>
  )
}
