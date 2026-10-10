import { LoaderCircle } from 'lucide-react';
import { type FormEvent } from 'react';
import { toast } from 'sonner';

import { ClientSelect } from '@/features/crm/components/ClientSelect';
import { toDateTimeLocalValue } from '@/features/crm/format';
import { taskTypeMeta, taskPriorityMeta } from '@/features/crm/labels';
import { taskFormSchema, type TaskFormValues } from '@/features/crm/schemas';
import { createTask, updateTask } from '@/features/crm/storage';
import type { Client, FollowUpTask, TaskPriority, TaskType } from '@/features/crm/types';
import { FieldErrors } from '@/shared/components/FieldErrors';
import { Button } from '@/shared/components/ui/button';
import { Dialog } from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { useAppForm } from '@/shared/hooks/useAppForm';

function defaultDueValue(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(10, 0, 0, 0);
  return toDateTimeLocalValue(date.toISOString());
}

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinicId: string;
  clients: readonly Client[];
  /** Si se pasa, el diálogo edita ese seguimiento; si no, crea uno nuevo. */
  task?: FollowUpTask;
  defaultClientId?: string;
}

/** Diálogo de alta/edición de un seguimiento (tarea de CRM). */
function TaskDialog({ open, onOpenChange, clinicId, clients, task, defaultClientId }: TaskDialogProps) {
  const form = useAppForm<TaskFormValues>({
    schema: taskFormSchema,
    defaultValues: {
      clientId: task?.clientId ?? defaultClientId ?? '',
      title: task?.title ?? '',
      type: task?.type ?? 'call',
      priority: task?.priority ?? 'medium',
      dueAt: task ? toDateTimeLocalValue(task.dueAt) : defaultDueValue(),
      notes: task?.notes ?? '',
    },
    onSubmit: (values) => {
      try {
        if (task) {
          updateTask(clinicId, task.id, values);
          toast.success('Seguimiento actualizado');
        } else {
          createTask(clinicId, values);
          toast.success('Seguimiento creado');
        }
        onOpenChange(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'No se pudo guardar el seguimiento');
      }
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    void form.handleSubmit();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={task ? 'Editar seguimiento' : 'Nuevo seguimiento'}
      description="Programa una llamada, mensaje o visita para dar seguimiento a un cliente."
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <form.Field name="clientId" validators={{ onChange: taskFormSchema.shape.clientId }}>
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Cliente</Label>
              <ClientSelect
                id={field.name}
                value={field.state.value}
                onChange={(value) => {
                  field.handleChange(value);
                }}
                clients={clients}
                ariaInvalid={!field.state.meta.isValid}
              />
              <FieldErrors errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>

        <form.Field name="title" validators={{ onChange: taskFormSchema.shape.title }}>
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Título</Label>
              <Input
                id={field.name}
                placeholder="Ej. Llamar para confirmar la cita"
                value={field.state.value}
                onChange={(event) => {
                  field.handleChange(event.target.value);
                }}
                onBlur={field.handleBlur}
                aria-invalid={!field.state.meta.isValid}
              />
              <FieldErrors errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <form.Field name="type" validators={{ onChange: taskFormSchema.shape.type }}>
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Tipo</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(value) => {
                    field.handleChange(value as TaskType);
                  }}
                >
                  <SelectTrigger id={field.name} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(taskTypeMeta) as TaskType[]).map((type) => (
                      <SelectItem key={type} value={type}>
                        {taskTypeMeta[type].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </form.Field>

          <form.Field name="priority" validators={{ onChange: taskFormSchema.shape.priority }}>
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Prioridad</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(value) => {
                    field.handleChange(value as TaskPriority);
                  }}
                >
                  <SelectTrigger id={field.name} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(taskPriorityMeta) as TaskPriority[]).map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {taskPriorityMeta[priority].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </form.Field>
        </div>

        <form.Field name="dueAt" validators={{ onChange: taskFormSchema.shape.dueAt }}>
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Fecha límite</Label>
              <Input
                id={field.name}
                type="datetime-local"
                value={field.state.value}
                onChange={(event) => {
                  field.handleChange(event.target.value);
                }}
                onBlur={field.handleBlur}
                aria-invalid={!field.state.meta.isValid}
              />
              <FieldErrors errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>

        <form.Field name="notes" validators={{ onChange: taskFormSchema.shape.notes }}>
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>
                Notas <span className="font-normal text-muted-foreground">(opcional)</span>
              </Label>
              <Textarea
                id={field.name}
                rows={3}
                placeholder="Detalles adicionales…"
                value={field.state.value}
                onChange={(event) => {
                  field.handleChange(event.target.value);
                }}
                onBlur={field.handleBlur}
              />
            </div>
          )}
        </form.Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
              <Button type="submit" disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? <LoaderCircle className="animate-spin" /> : null}
                {task ? 'Guardar cambios' : 'Crear seguimiento'}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </form>
    </Dialog>
  );
}

export { TaskDialog, type TaskDialogProps };
