import { LoaderCircle, Plus } from 'lucide-react';
import { type FormEvent } from 'react';
import { toast } from 'sonner';

import { activityKindMeta } from '@/features/crm/labels';
import {
  activityFormSchema,
  activityKindFieldSchema,
  activityTitleFieldSchema,
  type ActivityFormValues,
} from '@/features/crm/schemas';
import { logActivity } from '@/features/crm/storage';
import type { ActivityKind } from '@/features/crm/types';

/** Tipos de interacción admitidos en el composer (excluye 'system'). */
type ComposerKind = Exclude<ActivityKind, 'system'>;
import { FieldErrors } from '@/shared/components/FieldErrors';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
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

const composerKinds: readonly ComposerKind[] = ['note', 'call', 'whatsapp', 'email', 'visit'];

interface ActivityComposerProps {
  clinicId: string;
  clientId: string;
}

/** Formulario inline para registrar una interacción en la ficha del cliente. */
function ActivityComposer({ clinicId, clientId }: ActivityComposerProps) {
  const form = useAppForm<ActivityFormValues>({
    schema: activityFormSchema,
    defaultValues: {
      kind: 'note',
      title: '',
      description: '',
    },
    onSubmit: (values) => {
      logActivity(clinicId, { ...values, clientId });
      toast.success('Interacción registrada');
      form.reset();
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    void form.handleSubmit();
  }

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-base">Registrar interacción</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
            <form.Field name="kind" validators={{ onChange: activityKindFieldSchema }}>
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Tipo</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(value) => {
                      field.handleChange(value as ComposerKind);
                    }}
                  >
                    <SelectTrigger id={field.name} className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {composerKinds.map((kind) => (
                        <SelectItem key={kind} value={kind}>
                          {activityKindMeta[kind].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </form.Field>

            <form.Field name="title" validators={{ onChange: activityTitleFieldSchema }}>
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Resumen</Label>
                  <Input
                    id={field.name}
                    placeholder="Ej. Llamada de seguimiento"
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
          </div>

          <form.Field name="description" validators={{ onChange: activityFormSchema.shape.description }}>
            {(field) => (
              <div className="space-y-2">
                <Textarea
                  id={field.name}
                  rows={2}
                  placeholder="Detalles de la interacción…"
                  value={field.state.value}
                  onChange={(event) => {
                    field.handleChange(event.target.value);
                  }}
                  onBlur={field.handleBlur}
                />
              </div>
            )}
          </form.Field>

          <div className="flex justify-end">
            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <Button type="submit" size="sm" disabled={!canSubmit || isSubmitting}>
                  {isSubmitting ? <LoaderCircle className="animate-spin" /> : <Plus />}
                  Registrar
                </Button>
              )}
            </form.Subscribe>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export { ActivityComposer, type ActivityComposerProps };
