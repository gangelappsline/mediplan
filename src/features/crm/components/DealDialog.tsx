import { LoaderCircle } from 'lucide-react';
import { type FormEvent } from 'react';
import { toast } from 'sonner';

import { ClientSelect } from '@/features/crm/components/ClientSelect';
import { dateValueAfter } from '@/features/crm/format';
import { dealStageMeta, dealStageOrder } from '@/features/crm/labels';
import { dealFormSchema, type DealFormValues } from '@/features/crm/schemas';
import { createDeal, updateDeal } from '@/features/crm/storage';
import type { Client, Deal, DealStage } from '@/features/crm/types';
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

interface DealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinicId: string;
  clients: readonly Client[];
  /** Si se pasa, el diálogo edita esa oportunidad; si no, crea una nueva. */
  deal?: Deal;
  defaultClientId?: string;
  defaultStage?: DealStage;
}

/** Diálogo de alta/edición de una oportunidad del pipeline. */
function DealDialog({
  open,
  onOpenChange,
  clinicId,
  clients,
  deal,
  defaultClientId,
  defaultStage = 'new',
}: DealDialogProps) {
  const form = useAppForm<DealFormValues>({
    schema: dealFormSchema,
    defaultValues: {
      clientId: deal?.clientId ?? defaultClientId ?? '',
      title: deal?.title ?? '',
      value: deal?.value ?? 0,
      stage: deal?.stage ?? defaultStage,
      probability: deal?.probability ?? 40,
      expectedCloseAt: deal?.expectedCloseAt ?? dateValueAfter(15),
      notes: deal?.notes ?? '',
    },
    onSubmit: (values) => {
      try {
        if (deal) {
          updateDeal(clinicId, deal.id, values);
          toast.success('Oportunidad actualizada');
        } else {
          createDeal(clinicId, values);
          toast.success('Oportunidad creada');
        }
        onOpenChange(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'No se pudo guardar la oportunidad');
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
      title={deal ? 'Editar oportunidad' : 'Nueva oportunidad'}
      description="Registra una venta potencial y sigue su avance en el pipeline."
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <form.Field name="clientId" validators={{ onChange: dealFormSchema.shape.clientId }}>
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

        <form.Field name="title" validators={{ onChange: dealFormSchema.shape.title }}>
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Título de la oportunidad</Label>
              <Input
                id={field.name}
                placeholder="Ej. Ortodoncia invisible"
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
          <form.Field
            name="value"
            validators={{ onChange: dealFormSchema.shape.value }}
          >
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Valor estimado (USD)</Label>
                <Input
                  id={field.name}
                  type="number"
                  min={0}
                  step={50}
                  placeholder="1200"
                  value={Number.isFinite(field.state.value) ? field.state.value : 0}
                  onChange={(event) => {
                    field.handleChange(event.target.value === '' ? 0 : Number(event.target.value));
                  }}
                  onBlur={field.handleBlur}
                  aria-invalid={!field.state.meta.isValid}
                />
                <FieldErrors errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>

          <form.Field
            name="probability"
            validators={{ onChange: dealFormSchema.shape.probability }}
          >
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Probabilidad (%)</Label>
                <Input
                  id={field.name}
                  type="number"
                  min={0}
                  max={100}
                  step={5}
                  value={Number.isFinite(field.state.value) ? field.state.value : 0}
                  onChange={(event) => {
                    field.handleChange(event.target.value === '' ? 0 : Number(event.target.value));
                  }}
                  onBlur={field.handleBlur}
                  aria-invalid={!field.state.meta.isValid}
                />
                <FieldErrors errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <form.Field name="stage" validators={{ onChange: dealFormSchema.shape.stage }}>
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Etapa</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(value) => {
                    field.handleChange(value as DealStage);
                  }}
                >
                  <SelectTrigger id={field.name} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dealStageOrder.map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {dealStageMeta[stage].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </form.Field>

          <form.Field
            name="expectedCloseAt"
            validators={{ onChange: dealFormSchema.shape.expectedCloseAt }}
          >
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Cierre esperado</Label>
                <Input
                  id={field.name}
                  type="date"
                  value={field.state.value}
                  onChange={(event) => {
                    field.handleChange(event.target.value);
                  }}
                  onBlur={field.handleBlur}
                />
              </div>
            )}
          </form.Field>
        </div>

        <form.Field name="notes" validators={{ onChange: dealFormSchema.shape.notes }}>
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>
                Notas <span className="font-normal text-muted-foreground">(opcional)</span>
              </Label>
              <Textarea
                id={field.name}
                rows={3}
                placeholder="Detalles de la negociación…"
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
                {deal ? 'Guardar cambios' : 'Crear oportunidad'}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </form>
    </Dialog>
  );
}

export { DealDialog, type DealDialogProps };
