import { Handle, Position, type Node, type NodeProps, type NodeTypes } from '@xyflow/react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

import { AnimatedNumber } from '@/shared/components/motion/AnimatedNumber';
import { springSoft } from '@/shared/lib/animations';
import { cn } from '@/shared/lib/utils';

export type FlowTone = 'neutral' | 'primary' | 'success' | 'warn' | 'danger' | 'info' | 'violet';

const toneTile: Record<FlowTone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  primary: 'bg-primary/12 text-primary',
  success: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400',
  warn: 'bg-amber-500/12 text-amber-600 dark:text-amber-400',
  danger: 'bg-rose-500/12 text-rose-600 dark:text-rose-400',
  info: 'bg-sky-500/12 text-sky-600 dark:text-sky-400',
  violet: 'bg-violet-500/12 text-violet-600 dark:text-violet-400',
};

const toneAccent: Record<FlowTone, string> = {
  neutral: 'bg-muted-foreground/50',
  primary: 'bg-primary',
  success: 'bg-emerald-500',
  warn: 'bg-amber-500',
  danger: 'bg-rose-500',
  info: 'bg-sky-500',
  violet: 'bg-violet-500',
};

export interface EntityNodeLink {
  label: string;
  icon?: LucideIcon;
  /** Ruta interna; si se omite, la pastilla es informativa. */
  to?: string;
  title?: string;
}

export interface EntityNodeData extends Record<string, unknown> {
  label: string;
  description?: string;
  value?: number;
  /** Texto alternativo cuando `value` no aplica (p. ej. «Activo»). */
  valueText?: string;
  icon?: LucideIcon;
  tone?: FlowTone;
  metrics?: ReadonlyArray<{ label: string; value: string | number }>;
  /** Pastillas internas (pantallas de un panel, etapas…). */
  links?: ReadonlyArray<EntityNodeLink>;
  /** El nodo se puede activar (teclado o clic) para navegar o resaltar. */
  onSelect?: () => void;
  /** Marca visual del nodo activo (mapa de roles). */
  emphasized?: boolean;
  size?: 'sm' | 'md';
  /** Ancho del nodo en px (por defecto 212 / 178 en compacto). */
  width?: number;
}

export type EntityFlowNode = Node<EntityNodeData, 'entity'>;
export type ChipFlowNode = Node<EntityNodeData, 'chip'>;

/** Manifiestos de conexión: invisibles (el grafo es de lectura). */
function Handles() {
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </>
  );
}

interface ShellProps {
  data: EntityNodeData;
  children: React.ReactNode;
  className?: string;
}

/** Envoltorio común: foco por teclado, cursor y realce al pasar el ratón. */
function NodeShell({ data, children, className }: ShellProps) {
  const interactive = Boolean(data.onSelect);

  return (
    <motion.div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? data.label : undefined}
      onClick={(event) => {
        // Los enlaces internos (pastillas) navegan por su cuenta.
        if ((event.target as HTMLElement).closest('a')) return;
        data.onSelect?.();
      }}
      onKeyDown={(event) => {
        if (!interactive) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          data.onSelect?.();
        }
      }}
      whileHover={interactive ? { y: -3 } : undefined}
      transition={springSoft}
      className={cn(
        'relative overflow-hidden rounded-xl border bg-card text-left shadow-sm outline-none',
        'focus-visible:ring-[3px] focus-visible:ring-ring/50',
        interactive && 'cursor-pointer',
        data.emphasized ? 'border-primary/60 ring-2 ring-primary/25' : 'border-border/70',
        className,
      )}
    >
      <span aria-hidden="true" className={cn('absolute inset-x-0 top-0 h-0.5', toneAccent[data.tone ?? 'neutral'])} />
      {children}
    </motion.div>
  );
}

/** Nodo-tarjeta: icono, etiqueta, valor grande y métricas secundarias. */
function EntityNode({ data }: NodeProps<EntityFlowNode>) {
  const Icon = data.icon;
  const tone = data.tone ?? 'neutral';
  const compact = data.size === 'sm';
  const width = data.width ?? (compact ? 178 : 212);

  return (
    <div style={{ width }}>
      <Handles />
      <NodeShell data={data} className={compact ? 'p-2.5' : 'p-3'}>
        <div className="flex items-start gap-2.5">
          {Icon ? (
            <span className={cn('flex shrink-0 items-center justify-center rounded-lg', compact ? 'size-7' : 'size-9', toneTile[tone])}>
              <Icon className={compact ? 'size-3.5' : 'size-[18px]'} />
            </span>
          ) : null}
          <div className="min-w-0 flex-1">
            <p className={cn('truncate font-semibold tracking-tight', compact ? 'text-xs' : 'text-sm')}>{data.label}</p>
            {data.valueText ? (
              <p className="truncate text-[11px] text-muted-foreground">{data.valueText}</p>
            ) : null}
          </div>
          {typeof data.value === 'number' ? (
            <p className={cn('shrink-0 font-bold text-foreground', compact ? 'text-base' : 'text-2xl')}>
              <AnimatedNumber value={data.value} duration={0.7} />
            </p>
          ) : null}
        </div>

        {data.description ? (
          <p className="mt-2 line-clamp-2 text-[11px] leading-snug text-muted-foreground">{data.description}</p>
        ) : null}

        {data.links && data.links.length > 0 ? (
          <ul className="mt-2.5 flex flex-wrap gap-1.5">
            {data.links.map((link) => (
              <li key={link.label}>
                {link.to ? (
                  <Link
                    to={link.to}
                    title={link.title ?? link.label}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/60 px-2 py-0.5',
                      'text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary',
                    )}
                  >
                    {link.icon ? <link.icon className="size-3" /> : null}
                    {link.label}
                  </Link>
                ) : (
                  <span
                    title={link.title ?? link.label}
                    className="inline-flex cursor-default items-center gap-1 rounded-full border border-border/70 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                  >
                    {link.icon ? <link.icon className="size-3" /> : null}
                    {link.label}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : null}

        {data.metrics && data.metrics.length > 0 ? (
          <dl className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 border-t border-border/60 pt-2">
            {data.metrics.map((metric) => (
              <div key={metric.label} className="flex items-baseline gap-1">
                <dt className="text-[10px] text-muted-foreground">{metric.label}</dt>
                <dd className="text-[11px] font-semibold tabular-nums">
                  {typeof metric.value === 'number' ? <AnimatedNumber value={metric.value} duration={0.7} /> : metric.value}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </NodeShell>
    </div>
  );
}

/** Nodo-pastilla: elemento compacto (pantallas, etapas, sub-categorías). */
function ChipNode({ data }: NodeProps<ChipFlowNode>) {
  const Icon = data.icon;
  const tone = data.tone ?? 'neutral';

  return (
    <div className="w-[164px]">
      <Handles />
      <NodeShell data={data} className="flex items-center gap-2 px-2.5 py-2">
        {Icon ? (
          <span className={cn('flex size-6 shrink-0 items-center justify-center rounded-md', toneTile[tone])}>
            <Icon className="size-3.5" />
          </span>
        ) : (
          <span aria-hidden="true" className={cn('size-2 shrink-0 rounded-full', toneAccent[tone])} />
        )}
        <span className="min-w-0 flex-1 truncate text-xs font-medium">{data.label}</span>
        {typeof data.value === 'number' ? (
          <span className="shrink-0 text-xs font-semibold text-muted-foreground tabular-nums">
            <AnimatedNumber value={data.value} duration={0.6} />
          </span>
        ) : null}
      </NodeShell>
    </div>
  );
}

/** Tipos de nodo del lienzo (identidad estable para React Flow). */
export const flowNodeTypes = {
  entity: EntityNode,
  chip: ChipNode,
} satisfies NodeTypes;

export { ChipNode, EntityNode };
