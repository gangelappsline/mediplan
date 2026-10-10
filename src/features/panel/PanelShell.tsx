import { LogOut, Menu, Moon, PanelLeftClose, PanelLeftOpen, Search, Sun, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { ReactNode } from 'react';
import { Suspense, lazy, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';

import { useLogout } from '@/features/auth/hooks/useAuth';
import { buildCrumbs } from '@/features/panel/breadcrumbs';
import type { NavGroup, NavItem } from '@/features/panel/navigation';
import { getSession, subscribeSession } from '@/shared/api/session';
import { Avatar } from '@/shared/components/Avatar';
import { Breadcrumb } from '@/shared/components/Breadcrumb';
import type { PaletteAction } from '@/shared/components/CommandPalette';
import { Logo } from '@/shared/components/Logo';
import { PageTransition } from '@/shared/components/motion/PageTransition';
import { useTheme } from '@/shared/components/ThemeProvider';
import { Button } from '@/shared/components/ui/button';
import { Kbd } from '@/shared/components/ui/segmented';
import { Tooltip } from '@/shared/components/ui/tooltip';
import { usePersistentState } from '@/shared/hooks/usePersistentState';
import { springSoft, tweenFast } from '@/shared/lib/animations';
import { cn } from '@/shared/lib/utils';

/** La paleta de comandos se carga solo la primera vez que se abre. */
const CommandPalette = lazy(() =>
  import('@/shared/components/CommandPalette').then((module) => ({ default: module.CommandPalette })),
);

interface PanelShellProps {
  groups: NavGroup[];
  footerItem?: NavItem;
  roleLabel: string;
  headerTitle?: string;
  children: ReactNode;
  /**
   * Secciones dinámicas de la paleta de comandos (reciben el texto escrito y
   * una función para cerrarla). El panel de administración las usa para buscar
   * usuarios y negocios.
   */
  paletteSections?: (query: string, close: () => void) => ReactNode;
}

/** Atajo de teclado según plataforma (⌘ en macOS, Ctrl en el resto). */
function useModifierKey(): string {
  return useMemo(() => {
    if (typeof navigator === 'undefined') return 'Ctrl';
    return /mac|iphone|ipad|ipod/i.test(navigator.userAgent) ? '⌘' : 'Ctrl';
  }, []);
}

interface PanelNavLinkProps {
  item: NavItem;
  collapsed?: boolean;
  layoutId: string;
  onNavigate?: () => void;
}

function PanelNavLink({ item, collapsed = false, layoutId, onNavigate }: PanelNavLinkProps) {
  const link = (
    <NavLink
      to={item.to}
      end={item.end ?? false}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium outline-none',
          'transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50',
          isActive ? 'text-primary' : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
          collapsed && 'justify-center px-0',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive ? (
            <motion.span
              layoutId={`${layoutId}-pill`}
              transition={springSoft}
              className="absolute inset-0 rounded-lg bg-primary/10 ring-1 ring-primary/20"
            />
          ) : null}
          {isActive ? (
            <motion.span
              layoutId={`${layoutId}-bar`}
              transition={springSoft}
              className="absolute top-1/2 left-0 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary"
            />
          ) : null}
          <item.icon className="relative z-10 size-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110" />
          {collapsed ? (
            <span className="sr-only">{item.label}</span>
          ) : (
            <span className="relative z-10 truncate">{item.label}</span>
          )}
        </>
      )}
    </NavLink>
  );

  if (!collapsed) return link;

  return (
    <Tooltip content={item.label} side="right">
      {link}
    </Tooltip>
  );
}

interface PanelNavProps {
  groups: NavGroup[];
  footerItem?: NavItem;
  collapsed?: boolean;
  layoutId: string;
  onNavigate?: () => void;
}

function PanelNav({ groups, footerItem, collapsed = false, layoutId, onNavigate }: PanelNavProps) {
  return (
    <nav aria-label="Navegación del panel" className="scroll-area flex flex-1 flex-col gap-4 overflow-y-auto px-3 py-4">
      {groups.map((group, groupIndex) => (
        <div key={group.label} className="flex flex-col gap-1">
          {collapsed ? (
            groupIndex > 0 ? (
              <span aria-hidden="true" className="mx-auto my-1.5 h-px w-6 bg-border" />
            ) : null
          ) : (
            <p className="px-3 pb-1 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground/70 uppercase">
              {group.label}
            </p>
          )}
          {group.items.map((item) => (
            <PanelNavLink
              key={item.to}
              item={item}
              collapsed={collapsed}
              layoutId={layoutId}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ))}
      {footerItem ? (
        <div className={cn('mt-auto flex flex-col gap-1', collapsed ? '' : 'border-t pt-3')}>
          <PanelNavLink item={footerItem} collapsed={collapsed} layoutId={layoutId} onNavigate={onNavigate} />
        </div>
      ) : null}
    </nav>
  );
}

/** Layout de cualquier panel (negocio, cliente o administrador). */
function PanelShell({ groups, footerItem, roleLabel, headerTitle, children, paletteSections }: PanelShellProps) {
  const session = useSyncExternalStore(subscribeSession, getSession, getSession);
  const { theme, toggleTheme } = useTheme();
  const logout = useLogout();
  const location = useLocation();
  const navigate = useNavigate();
  const modifier = useModifierKey();

  const [collapsed, setCollapsed] = usePersistentState<boolean>('mediplan-sidebar-collapsed', false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteMounted, setPaletteMounted] = useState(false);

  const rootPath = groups[0]?.items[0]?.to ?? '/';
  const rootLabel = headerTitle ?? `Panel de ${roleLabel.toLowerCase()}`;

  const crumbs = useMemo(
    () => buildCrumbs({ groups, rootLabel, rootPath, pathname: location.pathname }),
    [groups, rootLabel, rootPath, location.pathname],
  );

  // Atajos globales del panel: ⌘K/Ctrl+K (paleta) y ⌘B/Ctrl+B (sidebar).
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const withModifier = event.metaKey || event.ctrlKey;
      if (!withModifier) return;

      const key = event.key.toLowerCase();
      if (key === 'k') {
        event.preventDefault();
        setPaletteMounted(true);
        setPaletteOpen((open) => !open);
      } else if (key === 'b') {
        event.preventDefault();
        setCollapsed((value) => !value);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setCollapsed]);

  // El cajón móvil se cierra al cambiar de pantalla.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const paletteActions = useMemo<PaletteAction[]>(
    () => [
      {
        id: 'theme',
        label: theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro',
        icon: theme === 'dark' ? Sun : Moon,
        keywords: ['tema', 'oscuro', 'claro', 'apariencia'],
        onSelect: toggleTheme,
      },
      {
        id: 'sidebar',
        label: collapsed ? 'Expandir menú lateral' : 'Plegar menú lateral',
        icon: collapsed ? PanelLeftOpen : PanelLeftClose,
        keywords: ['menu', 'lateral', 'sidebar'],
        hint: `${modifier} B`,
        onSelect: () => setCollapsed((value) => !value),
      },
      {
        id: 'landing',
        label: 'Ir al sitio público',
        icon: Search,
        keywords: ['inicio', 'landing', 'web'],
        onSelect: () => navigate('/'),
      },
      {
        id: 'logout',
        label: 'Cerrar sesión',
        icon: LogOut,
        keywords: ['salir', 'logout'],
        onSelect: () => logout.mutate(),
      },
    ],
    [theme, toggleTheme, collapsed, setCollapsed, modifier, navigate, logout],
  );

  const userName = session?.user.name ?? 'Invitado';
  const userEmail = session?.user.email ?? '';

  const userFooter = (isCollapsed: boolean) => (
    <div className={cn('border-t border-border/60 p-3', isCollapsed && 'flex justify-center')}>
      {isCollapsed ? (
        <Tooltip content={userName} side="right">
          <span className="flex">
            <Avatar name={userName} size="sm" />
          </span>
        </Tooltip>
      ) : (
        <div className="flex items-center gap-2.5 rounded-lg px-1 py-1">
          <Avatar name={userName} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{userName}</p>
            <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
          </div>
          <Tooltip content="Cerrar sesión">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
              aria-label="Cerrar sesión"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
            >
              <LogOut className="size-4" />
            </Button>
          </Tooltip>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/25">
      {/* ------------------------------ Sidebar ------------------------------ */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-border/60 bg-card transition-[width] duration-300 ease-out md:flex',
          collapsed ? 'w-[72px]' : 'w-64',
        )}
      >
        <div className={cn('flex h-16 shrink-0 items-center border-b border-border/60', collapsed ? 'justify-center px-2' : 'justify-between px-4')}>
          <Link to="/" aria-label="MediPlan — Ir al inicio" className="min-w-0">
            {collapsed ? <Logo markOnly /> : <Logo />}
          </Link>
          {collapsed ? null : (
            <Tooltip content={`Plegar menú (${modifier} B)`}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 text-muted-foreground"
                aria-label="Plegar menú lateral"
                onClick={() => setCollapsed(true)}
              >
                <PanelLeftClose className="size-4" />
              </Button>
            </Tooltip>
          )}
        </div>

        <PanelNav groups={groups} footerItem={footerItem} collapsed={collapsed} layoutId="panel-nav-desktop" />

        {collapsed ? (
          <div className="flex justify-center border-t border-border/60 py-2">
            <Tooltip content={`Expandir menú (${modifier} B)`}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground"
                aria-label="Expandir menú lateral"
                onClick={() => setCollapsed(false)}
              >
                <PanelLeftOpen className="size-4" />
              </Button>
            </Tooltip>
          </div>
        ) : null}

        {userFooter(collapsed)}
      </aside>

      {/* ------------------------------- Contenido ---------------------------- */}
      <div className={cn('transition-[padding] duration-300 ease-out', collapsed ? 'md:pl-[72px]' : 'md:pl-64')}>
        <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 md:hidden"
              aria-label="Abrir menú"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
            >
              <Menu />
            </Button>

            <Link to="/" className="shrink-0 md:hidden" aria-label="MediPlan — Ir al inicio">
              <Logo size="sm" />
            </Link>

            <div className="hidden min-w-0 md:block">
              <Breadcrumb items={crumbs} />
            </div>

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setPaletteMounted(true);
                  setPaletteOpen(true);
                }}
                aria-label="Abrir paleta de comandos"
                className={cn(
                  'group flex h-9 items-center gap-2 rounded-lg border border-border/70 bg-background/70 px-2.5 text-sm text-muted-foreground',
                  'shadow-xs transition-all hover:border-primary/40 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
                )}
              >
                <Search className="size-4 shrink-0 transition-transform group-hover:scale-110" />
                <span className="hidden lg:inline">Buscar o saltar a…</span>
                <Kbd className="ml-1 hidden sm:inline-flex">{modifier} K</Kbd>
              </button>

              <Tooltip content={theme === 'dark' ? 'Tema claro' : 'Tema oscuro'}>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
                  onClick={toggleTheme}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={theme}
                      initial={{ opacity: 0, rotate: -50, scale: 0.6 }}
                      animate={{ opacity: 1, rotate: 0, scale: 1 }}
                      exit={{ opacity: 0, rotate: 50, scale: 0.6 }}
                      transition={tweenFast}
                      className="flex"
                    >
                      {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
                    </motion.span>
                  </AnimatePresence>
                </Button>
              </Tooltip>

              <Tooltip content="Cerrar sesión">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="hidden sm:inline-flex"
                  onClick={() => logout.mutate()}
                  disabled={logout.isPending}
                >
                  <LogOut />
                  <span className="hidden lg:inline">Salir</span>
                </Button>
              </Tooltip>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
          <PageTransition transitionKey={location.pathname}>{children}</PageTransition>
        </main>
      </div>

      {/* --------------------------- Cajón móvil --------------------------- */}
      <AnimatePresence>
        {mobileOpen ? (
          <div className="fixed inset-0 z-50 md:hidden">
            <motion.div
              aria-hidden="true"
              className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={tweenFast}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="Menú del panel"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={springSoft}
              className="relative z-10 flex h-full w-[17rem] max-w-[85vw] flex-col border-r border-border/60 bg-card"
            >
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-border/60 px-4">
                <Logo />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Cerrar menú"
                  onClick={() => setMobileOpen(false)}
                >
                  <X />
                </Button>
              </div>
              <PanelNav
                groups={groups}
                footerItem={footerItem}
                layoutId="panel-nav-mobile"
                onNavigate={() => setMobileOpen(false)}
              />
              {userFooter(false)}
            </motion.aside>
          </div>
        ) : null}
      </AnimatePresence>

      {/* ------------------------- Paleta de comandos ------------------------ */}
      {paletteMounted ? (
        <Suspense fallback={null}>
          <CommandPalette
            open={paletteOpen}
            onOpenChange={setPaletteOpen}
            onNavigate={(to) => navigate(to)}
            groups={groups}
            actions={paletteActions}
            placeholder={`Buscar en el panel de ${roleLabel.toLowerCase()}…`}
          >
            {paletteSections ? (query, close) => paletteSections(query, close) : undefined}
          </CommandPalette>
        </Suspense>
      ) : null}
    </div>
  );
}

export { PanelShell };
