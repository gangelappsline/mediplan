import { ClipboardList, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import {
  TaskPriorityBadge,
  TaskTypeBadge,
} from '@/features/crm/components/Badges';
import { TaskDialog } from '@/features/crm/components/TaskDialog';
import { StatCard } from '@/features/crm/components/StatCard';
import { formatDateTime, formatRelativeDay, timeAgo } from '@/features/crm/format';
import { crmIcons, isTaskOverdue, taskPriorityMeta } from '@/features/crm/labels';
import { useCrm } from '@/features/crm/hooks/useCrm';
import {
  clientName,
  dashboardStats,
  doneTasks,
  overdueTasks,
  pendingTasks,
  tasksDueToday,
} from '@/features/crm/selectors';
import { deleteTask, toggleTaskDone } from '@/features/crm/storage';
import type { FollowUpTask } from '@/features/crm/types';
import { EmptyState } from '@/shared/components/EmptyState';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Tabs } from '@/shared/components/ui/tabs';
import { PageHeader } from '@/shared/components/PageHeader';
import { cn } from '@/shared/lib/utils';

type TaskFilter = 'pendientes' | 'vencidas' | 'hoy' | 'completadas' | 'todas';

/** Cola de seguimientos: tareas de CRM con vencimiento, prioridad y estado. */
function FollowUpsPage() {
  const { clinicId, data } = useCrm();
  const [filter, setFilter] = useState<TaskFilter>('pendientes');
  const [dialog, setDialog] = useState<{ open: boolean; task?: FollowUpTask }>({ open: false });

  const stats = dashboardStats(data);
  const pending = pendingTasks(data);
  const overdue = overdueTasks(data);
  const today = tasksDueToday(data);
  const done = doneTasks(data);

  const visible = useMemo(() => {
    switch (filter) {
      case 'pendientes':
        return pending;
      case 'vencidas':
        return overdue;
      case 'hoy':
        return today;
      case 'completadas':
        return done;
      case 'todas':
        return [...pending, ...done];
    }
  }, [filter, pending, overdue, today, done]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Seguimientos"
        description="Nunca dejes un cliente sin respuesta: llama, escribe o visita en el momento justo."
        actions={
          <Button
            type="button"
            onClick={() => {
              setDialog({ open: true });
            }}
          >
            <Plus />
            Nuevo seguimiento
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Pendientes"
          value={stats.pendingTasks}
          hint="En total"
          icon={ClipboardList}
          tone="primary"
        />
        <StatCard
          title="Vencidos"
          value={stats.overdue}
          hint={stats.overdue > 0 ? '¡Requieren atención hoy!' : 'Todo al día'}
          icon={crmIcons.clock}
          tone={stats.overdue > 0 ? 'danger' : 'success'}
        />
        <StatCard
          title="Para hoy"
          value={stats.dueToday}
          hint="Vencen antes de que termine el día"
          icon={crmIcons.sparkles}
          tone="warn"
        />
        <StatCard
          title="Completados"
          value={done.length}
          hint={`${stats.pendingTasks + done.length > 0 ? Math.round((done.length / (stats.pendingTasks + done.length)) * 100) : 0}% del total`}
          icon={crmIcons.heart}
          tone="info"
        />
      </div>

      <Tabs
        tabs={[
          { value: 'pendientes', label: 'Pendientes', count: pending.length },
          { value: 'vencidas', label: 'Vencidas', count: overdue.length },
          { value: 'hoy', label: 'Hoy', count: today.length },
          { value: 'completadas', label: 'Completadas', count: done.length },
          { value: 'todas', label: 'Todas', count: pending.length + done.length },
        ]}
        value={filter}
        onChange={(value) => {
          setFilter(value as TaskFilter);
        }}
      />

      {visible.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No hay seguimientos en esta vista"
          description="Crea un seguimiento o cambia de pestaña para ver el resto de tu actividad."
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDialog({ open: true });
              }}
            >
              <Plus />
              Crear seguimiento
            </Button>
          }
        />
      ) : (
        <Card className="border-border/60">
          <CardContent className="divide-y divide-border/60">
            {visible.map((task) => {
              const overdueTask = isTaskOverdue(task);

              return (
                <div key={task.id} className="flex items-start gap-3 py-3.5 first:pt-0 last:pb-0">
                  <button
                    type="button"
                    aria-label={
                      task.status === 'done' ? 'Marcar como pendiente' : 'Marcar como completada'
                    }
                    className={cn(
                      'mt-0.5 flex size-5 items-center justify-center rounded-full border transition-colors',
                      task.status === 'done'
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border hover:border-primary',
                    )}
                    onClick={() => {
                      toggleTaskDone(clinicId, task.id);
                      if (task.status === 'pending') {
                        toast.success('Seguimiento completado 🎉');
                      }
                    }}
                  >
                    {task.status === 'done' ? (
                      <svg
                        viewBox="0 0 12 12"
                        className="size-3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M2.5 6.5 5 9l4.5-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : null}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'text-sm font-medium',
                        task.status === 'done' && 'text-muted-foreground line-through',
                      )}
                    >
                      {task.title}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                      <Link
                        to={`/dashboard/clientes/${task.clientId}`}
                        className="font-medium text-primary underline-offset-2 hover:underline"
                      >
                        {clientName(data, task.clientId)}
                      </Link>
                      <TaskTypeBadge type={task.type} />
                      <TaskPriorityBadge priority={task.priority} />
                      <span
                        className={cn(
                          'inline-flex items-center gap-1',
                          overdueTask && 'font-medium text-rose-600 dark:text-rose-400',
                        )}
                      >
                        <span
                          className={cn('size-1.5 rounded-full', taskPriorityMeta[task.priority].dotClass)}
                          aria-hidden="true"
                        />
                        {task.status === 'done'
                          ? `Completada ${task.completedAt ? timeAgo(task.completedAt) : ''}`
                          : `Vence ${formatRelativeDay(task.dueAt)} · ${formatDateTime(task.dueAt).split(', ')[1]}`}
                      </span>
                    </div>
                    {task.notes ? (
                      <p className="mt-1 text-xs text-muted-foreground">{task.notes}</p>
                    ) : null}
                  </div>

                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Editar seguimiento"
                      onClick={() => {
                        setDialog({ open: true, task });
                      }}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Eliminar seguimiento"
                      onClick={() => {
                        deleteTask(clinicId, task.id);
                        toast.success('Seguimiento eliminado');
                      }}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <TaskDialog
        open={dialog.open}
        onOpenChange={(open) => {
          setDialog((prev) => ({ ...prev, open }));
        }}
        clinicId={clinicId}
        clients={data.clients}
        task={dialog.task}
      />
    </div>
  );
}

export { FollowUpsPage };
