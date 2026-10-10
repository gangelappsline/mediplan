import type { Edge, Node, XYPosition } from '@xyflow/react';
import { MarkerType } from '@xyflow/react';

import type { EntityNodeData, FlowTone } from '@/shared/components/flow/nodes';

export interface LayoutItem {
  id: string;
  /** Alto estimado del nodo (para centrar las columnas). */
  height: number;
}

interface LayoutOptions {
  columnWidth?: number;
  columnGap?: number;
  rowGap?: number;
}

/**
 * Coloca los nodos en columnas de izquierda a derecha, centrando cada una
 * respecto a la más alta. Devuelve `id → posición` para construir los nodos.
 */
export function layoutColumns(columns: ReadonlyArray<ReadonlyArray<LayoutItem>>, options: LayoutOptions = {}): Record<string, XYPosition> {
  const { columnWidth = 212, columnGap = 108, rowGap = 26 } = options;

  const columnHeights = columns.map((column) =>
    column.reduce((total, item) => total + item.height, 0) + rowGap * Math.max(0, column.length - 1),
  );
  const tallest = Math.max(0, ...columnHeights);

  const positions: Record<string, XYPosition> = {};

  columns.forEach((column, columnIndex) => {
    let y = (tallest - (columnHeights[columnIndex] ?? 0)) / 2;

    for (const item of column) {
      positions[item.id] = { x: columnIndex * (columnWidth + columnGap), y };
      y += item.height + rowGap;
    }
  });

  return positions;
}

export interface EntityNodeInput {
  id: string;
  position: XYPosition;
  data: EntityNodeData;
  type?: 'entity' | 'chip';
  dimmed?: boolean;
}

/** Construye un nodo del grafo con las clases de atenuado/realce. */
export function entityNode({ id, position, data, type = 'entity', dimmed = false }: EntityNodeInput): Node {
  return {
    id,
    type,
    position,
    data,
    className: cn(dimmed ? 'is-dimmed' : '', data.onSelect ? 'is-clickable' : ''),
  };
}

function cn(...values: Array<string | false | undefined>): string {
  return values.filter(Boolean).join(' ').trim();
}

export interface EdgeInput {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
  dimmed?: boolean;
  tone?: FlowTone;
}

const toneStroke: Record<FlowTone, string> = {
  neutral: 'var(--xy-edge-stroke-default)',
  primary: 'var(--primary)',
  success: '#10b981',
  warn: '#f59e0b',
  danger: '#f43f5e',
  info: '#0ea5e9',
  violet: '#8b5cf6',
};

/** Arista con etiqueta opcional y estados de atenuado/color. */
export function flowEdge({ id, source, target, label, animated = false, dimmed = false, tone = 'neutral' }: EdgeInput): Edge {
  const stroke = toneStroke[tone];

  return {
    id,
    source,
    target,
    type: 'smoothstep',
    animated,
    label,
    className: dimmed ? 'is-dimmed' : undefined,
    style: { stroke, strokeWidth: tone === 'neutral' ? 1.6 : 2 },
    markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: stroke },
    labelBgPadding: [6, 3],
    labelBgBorderRadius: 6,
  };
}
