import { CircleDollarSign, Handshake, Pencil, Plus, Target, TrendingUp, Trash2 } from 'lucide-react';
import { useState, type DragEvent } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import { DealDialog } from '@/features/crm/components/DealDialog';
import { StatCard } from '@/features/crm/components/StatCard';
import { formatCurrency, formatDate } from '@/features/crm/format';
import { dealStageMeta, dealStageOrder, crmIcons } from '@/features/crm/labels';
import { useCrm } from '@/features/crm/hooks/useCrm';
import {
  averageClientValue,
  clientName,
  dashboardStats,
  dealsByStage,
} from '@/features/crm/selectors';
import { deleteDeal, moveDealToStage } from '@/features/crm/storage';
import type { Deal, DealStage } from '@/features/crm/types';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { PageHeader } from '@/shared/components/PageHeader';
import { cn } from '@/shared/lib/utils';

/**
 * Pipeline de ventas en formato kanban: cada oportunidad se mueve entre etapas
 * con arrastre (drag & drop) o con los botones ‹ › de cada tarjeta.
 */
function PipelinePage() {
  const { clinicId, data } = useCrm();
  const [editing, setEditing] = useState<{ open: boolean; deal?: Deal }>({ open: false });
  const [creating, setCreating] = useState(false);
  const [dragOverStage, setDragOverStage] = useState<DealStage | null>(null);

  const grouped = dealsByStage(data);
  const stats = dashboardStats(data);

  function handleMove(deal: Deal, direction: -1 | 1) {
    const index = dealStageOrder.indexOf(deal.stage);
    const next = dealStageOrder[index + direction];
    if (!next) return;
    moveDealToStage(clinicId, deal.id, next);
    toast.success(`Oportunidad movida a "${dealStageMeta[next].label}"`);
  }

  function handleDrop(stage: DealStage, event: DragEvent) {
    event.preventDefault();
    setDragOverStage(null);
    const dealId = event.dataTransfer.getData('text/deal-id');
    const deal = data.deals.find((item) => item.id === dealId);
    if (!deal || deal.stage === stage) return;
    moveDealToStage(clinicId, deal.id, stage);
    toast.success(`Oportunidad movida a "${dealStageMeta[stage].label}"`);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pipeline de ventas"
        description="Sigue cada oportunidad desde que aparece hasta que se cierra. Arrastra las tarjetas entre etapas o usa las flechas."
        actions={
          <Button
            type="button"
            onClick={() => {
              setCreating(true);
            }}
          >
            <Plus />
            Nueva oportunidad
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Valor en pipeline"
          value={formatCurrency(stats.openValue)}
          hint={`${stats.openDeals} oportunidades abiertas`}
          icon={crmIcons.deal}
          tone="primary"
        />
        <StatCard
          title="Ganado"
          value={formatCurrency(stats.wonValue)}
          hint="Ingresos cerrados"
          icon={Handshake}
          tone="success"
        />
        <StatCard
          title="Tasa de conversión"
          value={`${stats.conversion}%`}
          hint="Deals ganados vs. cerrados"
          icon={Target}
          tone="info"
        />
        <StatCard
          title="Valor promedio ganado"
          value={formatCurrency(averageClientValue(data))}
          hint="Por oportunidad cerrada"
          icon={TrendingUp}
          tone="warn"
        />
      </div>

      <div className="-mx-1 overflow-x-auto pb-2">
        <div className="flex min-w-max gap-4 px-1">
          {dealStageOrder.map((stage) => {
            const meta = dealStageMeta[stage];
            const deals = grouped[stage];
            const total = deals.reduce((sum, deal) => sum + deal.value, 0);

            return (
              <section
                key={stage}
                aria-label={`Etapa ${meta.label}`}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragOverStage(stage);
                }}
                onDragLeave={() => {
                  setDragOverStage((prev) => (prev === stage ? null : prev));
                }}
                onDrop={(event) => {
                  handleDrop(stage, event);
                }}
                className={cn(
                  'flex w-72 shrink-0 flex-col rounded-xl border bg-muted/40 p-3 transition-colors',
                  dragOverStage === stage && 'border-primary bg-primary/5',
                )}
              >
                <header className="mb-3 space-y-1 px-1">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-semibold">{meta.label}</h2>
                    <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      {deals.length}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{formatCurrency(total)}</p>
                  <div className={cn('h-1 rounded-full', meta.barClass)} />
                </header>

                <div className="flex flex-1 flex-col gap-2">
                  {deals.map((deal) => (
                    <article
                      key={deal.id}
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.setData('text/deal-id', deal.id);
                        event.dataTransfer.effectAllowed = 'move';
                      }}
                      className="cursor-grab space-y-2 rounded-lg border bg-card p-3 shadow-xs transition-shadow hover:shadow-md active:cursor-grabbing"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm leading-snug font-medium">{deal.title}</p>
                        <div className="flex shrink-0 gap-0.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            aria-label="Editar oportunidad"
                            onClick={() => {
                              setEditing({ open: true, deal });
                            }}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            aria-label="Eliminar oportunidad"
                            onClick={() => {
                              deleteDeal(clinicId, deal.id);
                              toast.success('Oportunidad eliminada');
                            }}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>

                      <Link
                        to={`/dashboard/clientes/${deal.clientId}`}
                        className="text-xs text-muted-foreground underline-offset-2 hover:text-primary hover:underline"
                      >
                        {clientName(data, deal.clientId)}
                      </Link>

                      <div className="flex items-center justify-between gap-2">
                        <p className="text-base font-bold tracking-tight">
                          {formatCurrency(deal.value)}
                        </p>
                        <span className="text-xs text-muted-foreground">{deal.probability}%</span>
                      </div>

                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn('h-full rounded-full', meta.barClass)}
                          style={{ width: `${Math.max(4, deal.probability)}%` }}
                        />
                      </div>

                      {deal.expectedCloseAt ? (
                        <p className="text-xs text-muted-foreground">
                          Cierre: {formatDate(deal.expectedCloseAt)}
                        </p>
                      ) : null}

                      <div className="flex items-center justify-between pt-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          disabled={dealStageOrder.indexOf(deal.stage) === 0}
                          onClick={() => {
                            handleMove(deal, -1);
                          }}
                        >
                          ‹ Atrás
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          disabled={dealStageOrder.indexOf(deal.stage) === dealStageOrder.length - 1}
                          onClick={() => {
                            handleMove(deal, 1);
                          }}
                        >
                          Avanzar ›
                        </Button>
                      </div>
                    </article>
                  ))}

                  {deals.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                      Arrastra una oportunidad aquí
                    </div>
                  ) : null}

                  <button
                    type="button"
                    className="mt-1 flex items-center justify-center gap-1 rounded-lg border border-dashed py-2 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                    onClick={() => {
                      setCreating(true);
                    }}
                  >
                    <Plus className="size-3.5" />
                    Agregar aquí
                  </button>
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <CircleDollarSign className="size-3.5" />
        Las probabilidades se actualizan automáticamente al mover una oportunidad de etapa.
        ¿Necesitas ver el detalle? Abre la ficha del cliente desde la tarjeta.
      </p>

      <Card className="border-border/60 bg-muted/20">
        <CardContent className="text-sm text-muted-foreground">
          Consejo: combina el pipeline con{' '}
          <Link to="/dashboard/seguimientos" className="font-medium text-primary underline-offset-2 hover:underline">
            los seguimientos
          </Link>{' '}
          para no dejar ninguna oportunidad sin contacto. Cada movimiento de etapa queda registrado
          en el historial del cliente.
        </CardContent>
      </Card>

      <DealDialog
        open={creating || editing.open}
        onOpenChange={(open) => {
          if (!open) {
            setCreating(false);
            setEditing({ open: false });
          }
        }}
        clinicId={clinicId}
        clients={data.clients}
        deal={editing.deal}
      />
    </div>
  );
}

export { PipelinePage };
