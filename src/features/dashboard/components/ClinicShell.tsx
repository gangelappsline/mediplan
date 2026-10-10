import {
  CalendarDays,
  ChartColumn,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Moon,
  Settings,
  Sun,
  Target,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useSyncExternalStore } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';

import { clearSession, loadSession } from '@/features/auth/api';
import { useCrm } from '@/features/crm/hooks/useCrm';
import { overdueTasks } from '@/features/crm/selectors';
import { clinicDisplayName, clinicIdFromSession } from '@/features/whatsapp/clinic';
import { readPublicConnection, subscribeWhatsApp } from '@/features/whatsapp/storage';
import { Logo } from '@/shared/components/Logo';
import { useTheme } from '@/shared/components/ThemeProvider';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';

interface ClinicShellProps {
  children: ReactNode;
}

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  /** Indicador lateral opcional (p. ej. WhatsApp conectado o tareas vencidas). */
  indicator?: 'whatsapp' | 'overdue';
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: readonly NavGroup[] = [
  {
    label: 'Principal',
    items: [
      { to: '/dashboard', label: 'Resumen', icon: LayoutDashboard, end: true },
      { to: '/dashboard/agenda', label: 'Agenda', icon: CalendarDays },
    ],
  },
  {
    label: 'CRM',
    items: [
      { to: '/dashboard/clientes', label: 'Clientes', icon: Users },
      { to: '/dashboard/pipeline', label: 'Pipeline', icon: Target },
      { to: '/dashboard/seguimientos', label: 'Seguimientos', icon: ClipboardList, indicator: 'overdue' },
    ],
  },
  {
    label: 'Crecimiento',
    items: [
      { to: '/dashboard/whatsapp', label: 'WhatsApp', icon: MessageCircle, indicator: 'whatsapp' },
      { to: '/dashboard/reportes', label: 'Reportes', icon: ChartColumn },
    ],
  },
] as const;

const flatNavItems = navGroups.flatMap((group) => group.items);

function ClinicShell({ children }: ClinicShellProps) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const session = loadSession();
  const clinicId = clinicIdFromSession();
  const { data } = useCrm();
  const connection = useSyncExternalStore(
    subscribeWhatsApp,
    () => readPublicConnection(clinicId),
    () => null,
  );
  const clinicName = clinicDisplayName();
  const overdueCount = overdueTasks(data).length;

  function handleLogout() {
    clearSession();
    navigate('/');
  }

  function renderIndicator(item: NavItem) {
    if (item.indicator === 'whatsapp') {
      return (
        <span
          className={cn('size-2 rounded-full', connection ? 'bg-emerald-500' : 'bg-amber-500')}
          aria-label={connection ? 'WhatsApp sincronizado' : 'WhatsApp sin sincronizar'}
        />
      );
    }
    if (item.indicator === 'overdue' && overdueCount > 0) {
      return (
        <span
          className="inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] leading-none font-semibold text-white"
          aria-label={`${overdueCount} seguimientos vencidos`}
        >
          {overdueCount}
        </span>
      );
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-background md:flex">
        <div className="flex h-16 items-center px-5">
          <Link to="/" aria-label="MediPlan — Ir al inicio">
            <Logo />
          </Link>
        </div>
        <nav aria-label="Panel de la clínica" className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 pb-4">
          {navGroups.map((group) => (
            <div key={group.label} className="flex flex-col gap-1">
              <p className="px-3 pb-1 text-[10px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
                {group.label}
              </p>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end ?? false}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )
                  }
                >
                  <span className="inline-flex items-center gap-2">
                    <item.icon className="size-4" />
                    {item.label}
                  </span>
                  {renderIndicator(item)}
                </NavLink>
              ))}
            </div>
          ))}

          <div className="mt-auto flex flex-col gap-1 border-t pt-3">
            <NavLink
              to="/dashboard/configuracion"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )
              }
            >
              <Settings className="size-4" />
              Configuración
            </NavLink>
          </div>
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
            {flatNavItems.map((item) => (
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
            <NavLink
              to="/dashboard/configuracion"
              className={({ isActive }) =>
                cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm whitespace-nowrap',
                  isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                )
              }
            >
              <Settings className="size-3.5" />
              Ajustes
            </NavLink>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      </div>
    </div>
  );
}

export { ClinicShell };
