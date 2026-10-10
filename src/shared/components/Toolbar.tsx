import { LoaderCircle, Search, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { ComponentType, ReactNode } from 'react';
import { useEffect, useId, useRef } from 'react';

import { Kbd } from '@/shared/components/ui/segmented';
import { springSnappy, tweenFast } from '@/shared/lib/animations';
import { cn } from '@/shared/lib/utils';

/* ------------------------------- Contenedor ------------------------------- */

interface ToolbarProps {
  children: ReactNode;
  className?: string;
  /** Fija la barra bajo la cabecera del panel al hacer scroll. */
  sticky?: boolean;
}

/** Barra de herramientas de los listados: búsqueda, filtros y vistas. */
function Toolbar({ children, className, sticky = true }: ToolbarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={tweenFast}
      className={cn(
        'flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-card/80 p-2.5 shadow-sm backdrop-blur',
        sticky && 'sticky top-[4.5rem] z-20',
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

/* --------------------------------- Búsqueda -------------------------------- */

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel: string;
  /** Muestra el spinner mientras la consulta está en vuelo. */
  busy?: boolean;
  className?: string;
  autoFocus?: boolean;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  /** Atajo mostrado a la derecha; con `/` además enfoca el campo al pulsarlo. */
  shortcut?: string;
}

/** Campo de búsqueda con icono, limpieza animada e indicador de carga. */
function SearchInput({
  value,
  onChange,
  placeholder = 'Buscar…',
  ariaLabel,
  busy = false,
  className,
  autoFocus = false,
  onKeyDown,
  shortcut,
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // `/` enfoca la búsqueda cuando no se está escribiendo en otro campo.
  useEffect(() => {
    if (shortcut !== '/') return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return;
      event.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcut]);

  return (
    <div className={cn('relative min-w-0 flex-1 sm:max-w-sm', className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        type="search"
        role="searchbox"
        aria-label={ariaLabel}
        autoFocus={autoFocus}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        className={cn(
          'h-9 w-full rounded-lg border border-input bg-background/60 pr-16 pl-9 text-sm shadow-xs',
          'transition-[border-color,box-shadow,background-color] outline-none',
          'placeholder:text-muted-foreground',
          'focus-visible:border-ring focus-visible:bg-background focus-visible:ring-[3px] focus-visible:ring-ring/40',
          '[&::-webkit-search-cancel-button]:hidden',
        )}
      />
      <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1">
        {busy ? <LoaderCircle className="size-3.5 animate-spin text-muted-foreground" aria-hidden /> : null}
        <AnimatePresence initial={false}>
          {value ? (
            <motion.button
              key="clear"
              type="button"
              aria-label="Limpiar búsqueda"
              onClick={() => onChange('')}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={tweenFast}
              className="flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-3.5" />
            </motion.button>
          ) : shortcut && !busy ? (
            <motion.span key="kbd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Kbd>{shortcut}</Kbd>
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* --------------------------------- Filtros --------------------------------- */

export interface PillOption<TValue extends string> {
  value: TValue;
  label: string;
  count?: number;
  icon?: ComponentType<{ className?: string }>;
}

interface FilterPillsProps<TValue extends string> {
  options: ReadonlyArray<PillOption<TValue>>;
  value: TValue;
  onChange: (value: TValue) => void;
  ariaLabel: string;
  className?: string;
}

/** Filtros rápidos en pastillas con indicador deslizante. */
function FilterPills<TValue extends string>({ options, value, onChange, ariaLabel, className }: FilterPillsProps<TValue>) {
  const layoutId = useId();

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn('scroll-area -mx-1 flex items-center gap-1 overflow-x-auto px-1 py-0.5', className)}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        const Icon = option.icon;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-medium whitespace-nowrap',
              'outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50',
              isActive ? 'text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {isActive ? (
              <motion.span
                layoutId={`${layoutId}-pill`}
                transition={springSnappy}
                className="absolute inset-0 rounded-full bg-primary shadow-sm"
              />
            ) : null}
            {Icon ? <Icon className="relative z-10 size-3.5" /> : null}
            <span className="relative z-10">{option.label}</span>
            {typeof option.count === 'number' ? (
              <span
                className={cn(
                  'relative z-10 rounded-full px-1.5 text-[10px] leading-4 font-semibold tabular-nums',
                  isActive ? 'bg-primary-foreground/20' : 'bg-muted-foreground/10',
                )}
              >
                {option.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/* --------------------------------- Vistas ---------------------------------- */

export interface ViewOption<TValue extends string> {
  value: TValue;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

interface ViewToggleProps<TValue extends string> {
  options: ReadonlyArray<ViewOption<TValue>>;
  value: TValue;
  onChange: (value: TValue) => void;
  ariaLabel?: string;
  className?: string;
}

/** Cambio de vista (tabla, tarjetas, tablero…) con iconos y tooltip nativo. */
function ViewToggle<TValue extends string>({
  options,
  value,
  onChange,
  ariaLabel = 'Cambiar vista',
  className,
}: ViewToggleProps<TValue>) {
  const layoutId = useId();

  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn('inline-flex items-center gap-1 rounded-lg bg-muted p-1', className)}>
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            title={option.label}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative flex size-7 items-center justify-center rounded-md outline-none transition-colors',
              'focus-visible:ring-[3px] focus-visible:ring-ring/50',
              isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {isActive ? (
              <motion.span
                layoutId={`${layoutId}-view`}
                transition={springSnappy}
                className="absolute inset-0 rounded-md bg-background shadow-sm ring-1 ring-border/60"
              />
            ) : null}
            <option.icon className="relative z-10 size-4" />
            <span className="sr-only">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Resumen de resultados ("24 usuarios · página 2"). */
function ToolbarSummary({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('px-1 text-xs text-muted-foreground', className)}>{children}</p>;
}

export { FilterPills, SearchInput, Toolbar, ToolbarSummary, ViewToggle };
