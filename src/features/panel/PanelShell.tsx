import { LogOut, Moon, Sun } from 'lucide-react';
import type { ReactNode } from 'react';
import { useSyncExternalStore } from 'react';
import { Link, NavLink } from 'react-router-dom';

import { useLogout } from '@/features/auth/hooks/useAuth';
import { getSession, subscribeSession } from '@/shared/api/session';
import { Logo } from '@/shared/components/Logo';
import { useTheme } from '@/shared/components/ThemeProvider';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';

import type { NavGroup, NavItem } from '@/features/panel/navigation';

interface PanelShellProps {
  groups: NavGroup[];
  footerItem?: NavItem;
  roleLabel: string;
  headerTitle?: string;
  children: ReactNode;
}

const linkClass = (isActive: boolean) =>
  cn(
    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
  );

/** Layout de cualquier panel (negocio, cliente o administrador). */
function PanelShell({ groups, footerItem, roleLabel, headerTitle, children }: PanelShellProps) {
  const session = useSyncExternalStore(subscribeSession, getSession, getSession);
  const { theme, toggleTheme } = useTheme();
  const logout = useLogout();
  const allItems = [...groups.flatMap((group) => group.items), ...(footerItem ? [footerItem] : [])];

  return (
    <div className="min-h-screen bg-muted/30">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-background md:flex">
        <div className="flex h-16 items-center px-5">
          <Link to="/" aria-label="MediPlan — Ir al inicio">
            <Logo />
          </Link>
        </div>
        <nav aria-label="Navegación del panel" className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 pb-4">
          {groups.map((group) => (
            <div key={group.label} className="flex flex-col gap-1">
              <p className="px-3 pb-1 text-[10px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
                {group.label}
              </p>
              {group.items.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end ?? false} className={({ isActive }) => linkClass(isActive)}>
                  <item.icon className="size-4" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
          {footerItem ? (
            <div className="mt-auto flex flex-col gap-1 border-t pt-3">
              <NavLink to={footerItem.to} className={({ isActive }) => linkClass(isActive)}>
                <footerItem.icon className="size-4" />
                {footerItem.label}
              </NavLink>
            </div>
          ) : null}
        </nav>
        <div className="border-t px-4 py-4">
          <p className="truncate text-sm font-medium">{session?.user.name ?? 'Invitado'}</p>
          <p className="truncate text-xs text-muted-foreground">{session?.user.email}</p>
        </div>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
            <Link to="/" className="md:hidden" aria-label="MediPlan — Ir al inicio">
              <Logo size="sm" />
            </Link>
            <p className="hidden text-sm text-muted-foreground md:block">
              {headerTitle ?? `Panel de ${roleLabel.toLowerCase()}`}
            </p>
            <div className="ml-auto flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
                onClick={toggleTheme}
              >
                {theme === 'dark' ? <Sun /> : <Moon />}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => logout.mutate()} disabled={logout.isPending}>
                <LogOut />
                <span className="hidden sm:inline">Cerrar sesión</span>
              </Button>
            </div>
          </div>
          <nav aria-label="Secciones del panel" className="flex gap-1 overflow-x-auto px-3 pb-3 md:hidden">
            {allItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end ?? false}
                className={({ isActive }) =>
                  cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm whitespace-nowrap',
                    isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                  )
                }
              >
                <item.icon className="size-3.5" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      </div>
    </div>
  );
}

export { PanelShell };
