import { CalendarDays, LayoutDashboard, LogOut, MessageCircle, Moon, Sun, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { useSyncExternalStore } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';

import { clearSession, loadSession } from '@/features/auth/api';
import { clinicDisplayName, clinicIdFromSession } from '@/features/whatsapp/clinic';
import { readPublicConnection, subscribeWhatsApp } from '@/features/whatsapp/storage';
import { Logo } from '@/shared/components/Logo';
import { useTheme } from '@/shared/components/ThemeProvider';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';

interface ClinicShellProps {
  children: ReactNode;
}

const navItems = [
  { to: '/dashboard', label: 'Resumen', icon: LayoutDashboard, end: true, disabled: false },
  { to: '/dashboard/whatsapp', label: 'WhatsApp', icon: MessageCircle, end: false, disabled: false },
  { to: '/dashboard/agenda', label: 'Agenda', icon: CalendarDays, end: false, disabled: true },
  { to: '/dashboard/pacientes', label: 'Pacientes', icon: Users, end: false, disabled: true },
] as const;

function ClinicShell({ children }: ClinicShellProps) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const session = loadSession();
  const clinicId = clinicIdFromSession();
  const connection = useSyncExternalStore(
    subscribeWhatsApp,
    () => readPublicConnection(clinicId),
    () => null,
  );
  const clinicName = clinicDisplayName();

  function handleLogout() {
    clearSession();
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-background md:flex">
        <div className="flex h-16 items-center px-5">
          <Link to="/" aria-label="MediPlan — Ir al inicio">
            <Logo />
          </Link>
        </div>
        <nav aria-label="Panel de la clínica" className="flex flex-1 flex-col gap-1 px-3">
          {navItems.map((item) =>
            item.disabled ? (
              <span
                key={item.label}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-muted-foreground/70"
              >
                <span className="inline-flex items-center gap-2">
                  <item.icon className="size-4" />
                  {item.label}
                </span>
                <span className="text-[10px] tracking-wide uppercase">Pronto</span>
              </span>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )
                }
              >
                <span className="inline-flex items-center gap-2">
                  <item.icon className="size-4" />
                  {item.label}
                </span>
                {item.to === '/dashboard/whatsapp' ? (
                  <span
                    className={cn('size-2 rounded-full', connection ? 'bg-emerald-500' : 'bg-amber-500')}
                    aria-label={connection ? 'WhatsApp sincronizado' : 'WhatsApp sin sincronizar'}
                  />
                ) : null}
              </NavLink>
            ),
          )}
        </nav>
        <div className="border-t px-4 py-4">
          <p className="truncate text-sm font-medium">{session?.user.name ?? 'Invitado'}</p>
          <p className="truncate text-xs text-muted-foreground">{clinicName}</p>
        </div>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
            <Link to="/" className="md:hidden" aria-label="MediPlan — Ir al inicio">
              <Logo size="sm" />
            </Link>
            <p className="hidden text-sm text-muted-foreground md:block">Panel de {clinicName}</p>
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
              <Button type="button" variant="outline" size="sm" onClick={handleLogout}>
                <LogOut />
                <span className="hidden sm:inline">Cerrar sesión</span>
              </Button>
            </div>
          </div>
          <nav aria-label="Secciones del panel" className="flex gap-1 overflow-x-auto px-3 pb-3 md:hidden">
            {navItems.map((item) =>
              item.disabled ? null : (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'rounded-full px-3 py-1.5 text-sm whitespace-nowrap',
                      isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ),
            )}
          </nav>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      </div>
    </div>
  );
}

export { ClinicShell };
