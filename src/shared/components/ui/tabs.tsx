import type { ComponentType } from 'react';

import { cn } from '@/shared/lib/utils';

interface TabItem {
  value: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  /** Contador opcional mostrado junto a la etiqueta. */
  count?: number;
}

interface TabsProps {
  tabs: ReadonlyArray<TabItem>;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/**
 * Barra de pestañas accesible (`role="tablist"`) con estilo segmentado.
 * Controlada: el padre decide qué pestaña está activa.
 */
function Tabs({ tabs, value, onChange, className }: TabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Secciones"
      className={cn('inline-flex flex-wrap gap-1 rounded-lg bg-muted p-1', className)}
    >
      {tabs.map((tab) => {
        const isActive = tab.value === value;

        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => {
              onChange(tab.value);
            }}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
              'outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
              isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.icon ? <tab.icon className="size-4" /> : null}
            {tab.label}
            {typeof tab.count === 'number' ? (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] leading-none font-semibold',
                  isActive ? 'bg-primary/10 text-primary' : 'bg-muted-foreground/10 text-muted-foreground',
                )}
              >
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export { Tabs, type TabsProps, type TabItem };
