import { motion } from 'motion/react';
import type { ComponentType, ReactNode } from 'react';
import { useId } from 'react';

import { springSnappy } from '@/shared/lib/animations';
import { cn } from '@/shared/lib/utils';

export interface SegmentedOption<TValue extends string> {
  value: TValue;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  /** Contador opcional mostrado junto a la etiqueta. */
  count?: number;
  title?: string;
}

interface SegmentedProps<TValue extends string> {
  options: ReadonlyArray<SegmentedOption<TValue>>;
  value: TValue;
  onChange: (value: TValue) => void;
  ariaLabel: string;
  className?: string;
  size?: 'sm' | 'md';
  /** `true` para mostrar solo el icono (con tooltip nativo por `title`). */
  iconOnly?: boolean;
}

/**
 * Control segmentado con indicador animado (`layoutId`): al cambiar de opción
 * la pastilla activa se desliza. Semántica de `radiogroup` para lectores de
 * pantalla y navegación con flechas.
 */
function Segmented<TValue extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
  size = 'md',
  iconOnly = false,
}: SegmentedProps<TValue>) {
  const layoutId = useId();

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const delta = event.key === 'ArrowRight' ? 1 : -1;
    const next = options[(index + delta + options.length) % options.length];
    if (next) {
      onChange(next.value);
      const button = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('button')[
        (index + delta + options.length) % options.length
      ];
      button?.focus();
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn('inline-flex items-center gap-1 rounded-lg bg-muted p-1', className)}
    >
      {options.map((option, index) => {
        const isActive = option.value === value;
        const Icon = option.icon;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            title={option.title ?? (iconOnly ? option.label : undefined)}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            className={cn(
              'relative inline-flex items-center justify-center gap-1.5 rounded-md font-medium whitespace-nowrap',
              'outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50',
              size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3 text-sm',
              isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
              iconOnly && (size === 'sm' ? 'w-7 px-0' : 'w-8 px-0'),
            )}
          >
            {isActive ? (
              <motion.span
                layoutId={`${layoutId}-indicator`}
                transition={springSnappy}
                className="absolute inset-0 rounded-md bg-background shadow-sm ring-1 ring-border/60"
              />
            ) : null}
            {Icon ? <Icon className={cn(size === 'sm' ? 'size-3.5' : 'size-4')} /> : null}
            {iconOnly ? (
              <span className="sr-only">{option.label}</span>
            ) : (
              <span className="relative z-10 inline-flex items-center gap-1.5">
                {option.label}
                {typeof option.count === 'number' ? (
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[10px] leading-none font-semibold tabular-nums',
                      isActive ? 'bg-primary/10 text-primary' : 'bg-muted-foreground/10 text-muted-foreground',
                    )}
                  >
                    {option.count}
                  </span>
                ) : null}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export { Segmented, type SegmentedProps };

/** Etiqueta de atajo de teclado (`⌘K`, `Esc`…). */
function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'pointer-events-none inline-flex h-5 min-w-5 items-center justify-center gap-0.5 rounded border border-border/80',
        'bg-muted/70 px-1.5 font-sans text-[10px] font-semibold text-muted-foreground',
        className,
      )}
    >
      {children}
    </kbd>
  );
}

export { Kbd };
