import { Command } from 'cmdk';
import { CornerDownLeft, Search } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { NavGroup } from '@/features/panel/navigation';
import { Kbd } from '@/shared/components/ui/segmented';
import { popIn, springGentle, tweenFast } from '@/shared/lib/animations';

export interface PaletteAction {
  id: string;
  label: string;
  /** Texto secundario (atajo, descripción corta…). */
  hint?: string;
  icon?: LucideIcon;
  keywords?: string[];
  onSelect: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Navegación con el router (se inyecta desde el shell del panel). */
  onNavigate: (to: string) => void;
  groups: ReadonlyArray<NavGroup>;
  /** Acciones rápidas (tema, atajos, cerrar sesión…). */
  actions?: ReadonlyArray<PaletteAction>;
  /** Secciones dinámicas que dependen del texto (búsquedas contra la API). */
  children?: (query: string, close: () => void) => ReactNode;
  placeholder?: string;
  emptyMessage?: string;
}

function matches(query: string, haystack: string[]): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return haystack.some((text) => text.toLowerCase().includes(needle));
}

/**
 * Paleta de comandos (`⌘K` / `Ctrl+K`): navegación por teclado a cualquier
 * pantalla del panel, acciones rápidas y búsqueda de entidades.
 *
 * `shouldFilter` se desactiva porque el filtrado lo hace cada sección (las
 * búsquedas de entidades vienen ya filtradas por la API).
 */
function CommandPalette({
  open,
  onOpenChange,
  onNavigate,
  groups,
  actions = [],
  children,
  placeholder = 'Buscar pantallas, acciones o registros…',
  emptyMessage = 'No hay resultados para esta búsqueda.',
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // cmdk enfoca el input al montarse; se refuerza por si la animación lo retrasa.
    const id = window.setTimeout(() => inputRef.current?.focus(), 40);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onOpenChange(false);
    }
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      window.clearTimeout(id);
    };
  }, [open, onOpenChange]);

  const navItems = useMemo(
    () =>
      groups.flatMap((group) =>
        group.items.map((item) => ({ ...item, groupLabel: group.label })),
      ),
    [groups],
  );

  const filteredNav = useMemo(
    () => navItems.filter((item) => matches(query, [item.label, item.to, item.groupLabel])),
    [navItems, query],
  );

  const filteredActions = useMemo(
    () => actions.filter((action) => matches(query, [action.label, action.hint ?? '', ...(action.keywords ?? [])])),
    [actions, query],
  );

  const hasLocalResults = filteredNav.length > 0 || filteredActions.length > 0;

  function close() {
    onOpenChange(false);
  }

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh]">
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 bg-black/50 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={tweenFast}
            onClick={close}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Paleta de comandos"
            className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-border/70 bg-elevated shadow-2xl"
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={springGentle}
          >
            <Command shouldFilter={false} className="w-full">
              <div className="flex items-center gap-2 border-b border-border/60 px-4">
                <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <Command.Input
                  ref={inputRef}
                  value={query}
                  onValueChange={setQuery}
                  placeholder={placeholder}
                  className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
                />
                <Kbd>Esc</Kbd>
              </div>

              <Command.List className="scroll-area max-h-[min(26rem,58vh)] overflow-y-auto p-2">
                {filteredNav.length > 0 ? (
                  <Command.Group
                    heading="Ir a"
                    className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground/80 [&_[cmdk-group-heading]]:uppercase"
                  >
                    {filteredNav.map((item) => (
                      <Command.Item
                        key={item.to}
                        value={item.to}
                        onSelect={() => {
                          close();
                          onNavigate(item.to);
                        }}
                        className="group flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2.5 text-sm data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
                      >
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-data-[selected=true]:bg-primary/15 group-data-[selected=true]:text-primary">
                          <item.icon className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{item.label}</span>
                          <span className="block truncate text-xs text-muted-foreground">{item.groupLabel}</span>
                        </span>
                        <CornerDownLeft className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-data-[selected=true]:opacity-100" />
                      </Command.Item>
                    ))}
                  </Command.Group>
                ) : null}

                {children ? children(query, close) : null}

                {filteredActions.length > 0 ? (
                  <Command.Group
                    heading="Acciones"
                    className="mt-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground/80 [&_[cmdk-group-heading]]:uppercase"
                  >
                    {filteredActions.map((action) => (
                      <Command.Item
                        key={action.id}
                        value={action.id}
                        onSelect={() => {
                          close();
                          action.onSelect();
                        }}
                        className="group flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2.5 text-sm data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
                      >
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          {action.icon ? <action.icon className="size-4" /> : null}
                        </span>
                        <span className="min-w-0 flex-1 truncate font-medium">{action.label}</span>
                        {action.hint ? <span className="shrink-0 text-xs text-muted-foreground">{action.hint}</span> : null}
                      </Command.Item>
                    ))}
                  </Command.Group>
                ) : null}

                {!hasLocalResults && !children ? (
                  <motion.p variants={popIn} initial="hidden" animate="visible" className="py-10 text-center text-sm text-muted-foreground">
                    {emptyMessage}
                  </motion.p>
                ) : null}
              </Command.List>

              <div className="flex items-center justify-between gap-3 border-t border-border/60 px-4 py-2.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Kbd>↑</Kbd>
                  <Kbd>↓</Kbd>
                  para navegar
                  <Kbd>↵</Kbd>
                  para abrir
                </span>
                <span className="hidden sm:inline">{filteredNav.length + filteredActions.length} resultados locales</span>
              </div>
            </Command>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

export { CommandPalette, type CommandPaletteProps };
