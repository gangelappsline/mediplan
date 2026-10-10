import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  type Edge,
  type FitViewOptions,
  type Node,
} from '@xyflow/react';
import type { ReactNode } from 'react';

import { flowNodeTypes } from '@/shared/components/flow/nodes';
import { cn } from '@/shared/lib/utils';

interface FlowCanvasProps {
  nodes: Node[];
  edges: Edge[];
  /** Etiqueta accesible del lienzo. */
  ariaLabel: string;
  /** Alto del lienzo (React Flow necesita dimensiones explícitas). */
  height?: number | string;
  className?: string;
  showControls?: boolean;
  showMiniMap?: boolean;
  fitViewOptions?: FitViewOptions;
  /** Pie del lienzo: leyenda, pistas de interacción o enlaces equivalentes. */
  caption?: ReactNode;
  /** Contenido adicional fuera del lienzo (p. ej. detalle del nodo activo). */
  aside?: ReactNode;
}

/**
 * Lienzo de nodos (React Flow) tematizado con las variables de MediPlan.
 *
 * Es un grafo de lectura: no se crean conexiones ni se arrastran nodos, pero
 * cada nodo puede ser interactivo (navegar o resaltar ramas) y es accesible
 * por teclado desde el propio nodo.
 */
function FlowCanvas({
  nodes,
  edges,
  ariaLabel,
  height = 420,
  className,
  showControls = true,
  showMiniMap = false,
  fitViewOptions,
  caption,
  aside,
}: FlowCanvasProps) {
  return (
    <div className={cn('overflow-hidden rounded-xl border border-border/60 bg-card', className)}>
      <div className="mediplan-flow relative" style={{ height }} aria-label={ariaLabel}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={flowNodeTypes}
          fitView
          fitViewOptions={{ padding: 0.18, maxZoom: 1.1, ...fitViewOptions }}
          minZoom={0.4}
          maxZoom={1.6}
          nodesDraggable={false}
          nodesConnectable={false}
          nodesFocusable={false}
          elementsSelectable={false}
          zoomOnScroll={false}
          zoomOnDoubleClick={false}
          zoomOnPinch
          panOnScroll={false}
          panOnDrag
          preventScrolling={false}
          elevateNodesOnSelect={false}
          defaultEdgeOptions={{ type: 'smoothstep' }}
        >
          <Background variant={BackgroundVariant.Dots} gap={18} size={1.2} />
          {showControls ? <Controls showInteractive={false} position="bottom-left" /> : null}
          {showMiniMap ? <MiniMap pannable zoomable position="bottom-right" className="!bg-card" /> : null}
        </ReactFlow>
      </div>
      {caption || aside ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 px-4 py-3">
          {caption ? <div className="text-xs text-muted-foreground">{caption}</div> : null}
          {aside}
        </div>
      ) : null}
    </div>
  );
}

export { FlowCanvas, type FlowCanvasProps };
