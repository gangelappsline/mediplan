import { ArrowLeft, LoaderCircle, Plus, Trash2, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { clientSourceMeta, clientStatusMeta, suggestedTags } from '@/features/crm/labels';
import {
  clientEmailFieldSchema,
  clientFormSchema,
  clientNameFieldSchema,
  clientPhoneFieldSchema,
  clientSourceFieldSchema,
  clientStatusFieldSchema,
  type ClientFormValues,
} from '@/features/crm/schemas';
import { createClient, deleteClient, updateClient } from '@/features/crm/storage';
import type { ClientSource, ClientStatus } from '@/features/crm/types';
import { useCrm } from '@/features/crm/hooks/useCrm';
import { clientById } from '@/features/crm/selectors';
import { FieldErrors } from '@/shared/components/FieldErrors';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
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
import { PageHeader } from '@/shared/components/PageHeader';
import { useAppForm } from '@/shared/hooks/useAppForm';
import { cn } from '@/shared/lib/utils';

/** Alta y edición de clientes (`/dashboard/clientes/nuevo` y `.../editar`). */
function ClientFormPage() {
  const { clienteId } = useParams<{ clienteId: string }>();
  const navigate = useNavigate();
  const { clinicId, data } = useCrm();
  const existing = clienteId ? clientById(data, clienteId) : undefined;
  const isEditing = Boolean(existing);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const form = useAppForm<ClientFormValues>({
    schema: clientFormSchema,
    defaultValues: {
      name: existing?.name ?? '',
      email: existing?.email ?? '',
      phone: existing?.phone ?? '',
      status: existing?.status ?? 'lead',
      source: existing?.source ?? 'whatsapp',
      tags: existing?.tags ?? [],
      company: existing?.company ?? '',
      birthDate: existing?.birthDate ?? '',
      notes: existing?.notes ?? '',
    },
    onSubmit: (values) => {
      try {
        if (existing) {
          updateClient(clinicId, existing.id, values);
          toast.success('Cliente actualizado');
          navigate(`/dashboard/clientes/${existing.id}`);
        } else {
          const client = createClient(clinicId, values);
          toast.success('Cliente creado');
          navigate(`/dashboard/clientes/${client.id}`);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'No se pudo guardar el cliente');
      }
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    void form.handleSubmit();
  }

  function handleDelete() {
    if (!existing) return;
    deleteClient(clinicId, existing.id);
    toast.success('Cliente eliminado');
    navigate('/dashboard/clientes');
  }

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3">
          <Link to={existing ? `/dashboard/clientes/${existing.id}` : '/dashboard/clientes'}>
            <ArrowLeft />
            Volver
          </Link>
        </Button>
        <PageHeader
          title={isEditing ? 'Editar cliente' : 'Nuevo cliente'}
          description={
            isEditing
              ? 'Actualiza los datos de contacto, el estado y las etiquetas del cliente.'
              : 'Registra un cliente en tu CRM: contacto, origen, etiquetas y notas de contexto.'
          }
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Datos de contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form.Field name="name" validators={{ onChange: clientNameFieldSchema, onBlur: clientNameFieldSchema }}>
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Nombre completo</Label>
                  <Input
                    id={field.name}
                    placeholder="Ej. Ana Gabriela Torres"
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
              <form.Field name="email" validators={{ onChange: clientEmailFieldSchema, onBlur: clientEmailFieldSchema }}>
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>
                      Correo electrónico{' '}
                      <span className="font-normal text-muted-foreground">(opcional)</span>
                    </Label>
                    <Input
                      id={field.name}
                      type="email"
                      placeholder="cliente@correo.com"
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

              <form.Field name="phone" validators={{ onChange: clientPhoneFieldSchema, onBlur: clientPhoneFieldSchema }}>
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>
                      Teléfono / WhatsApp{' '}
                      <span className="font-normal text-muted-foreground">(opcional)</span>
                    </Label>
                    <Input
                      id={field.name}
                      type="tel"
                      placeholder="+52 55 1234 5678"
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
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Perfil comercial</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <form.Field name="status" validators={{ onChange: clientStatusFieldSchema }}>
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Estado</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => {
                        field.handleChange(value as ClientStatus);
                      }}
                    >
                      <SelectTrigger id={field.name} className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(clientStatusMeta) as ClientStatus[]).map((status) => (
                          <SelectItem key={status} value={status}>
                            {clientStatusMeta[status].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>

              <form.Field name="source" validators={{ onChange: clientSourceFieldSchema }}>
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Origen</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => {
                        field.handleChange(value as ClientSource);
                      }}
                    >
                      <SelectTrigger id={field.name} className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(clientSourceMeta) as ClientSource[]).map((source) => (
                          <SelectItem key={source} value={source}>
                            {clientSourceMeta[source].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>
            </div>

            <form.Field name="tags">
              {(field) => {
                const selected = field.state.value;

                function toggleTag(tag: string) {
                  field.handleChange(
                    selected.includes(tag)
                      ? selected.filter((item) => item !== tag)
                      : [...selected, tag],
                  );
                }

                return (
                  <div className="space-y-2">
                    <Label>Etiquetas</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestedTags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            toggleTag(tag);
                          }}
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                            selected.includes(tag)
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
                          )}
                        >
                          {selected.includes(tag) ? <X className="size-3" /> : <Plus className="size-3" />}
                          {tag}
                        </button>
                      ))}
                      {selected
                        .filter((tag) => !(suggestedTags as readonly string[]).includes(tag))
                        .map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              toggleTag(tag);
                            }}
                            className="inline-flex items-center gap-1 rounded-full border border-primary bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                          >
                            <X className="size-3" />
                            {tag}
                          </button>
                        ))}
                    </div>
                    <div className="flex gap-2">
                      <TagAddInput
                        onAdd={(tag) => {
                          if (!selected.includes(tag)) {
                            field.handleChange([...selected, tag]);
                          }
                        }}
                      />
                    </div>
                  </div>
                );
              }}
            </form.Field>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Detalles adicionales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <form.Field name="company">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>
                      Empresa <span className="font-normal text-muted-foreground">(opcional)</span>
                    </Label>
                    <Input
                      id={field.name}
                      placeholder="Ej. Estudio Cruz"
                      value={field.state.value}
                      onChange={(event) => {
                        field.handleChange(event.target.value);
                      }}
                      onBlur={field.handleBlur}
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="birthDate">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>
                      Fecha de nacimiento{' '}
                      <span className="font-normal text-muted-foreground">(opcional)</span>
                    </Label>
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

            <form.Field name="notes">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>
                    Notas <span className="font-normal text-muted-foreground">(opcional)</span>
                  </Label>
                  <Textarea
                    id={field.name}
                    rows={4}
                    placeholder="Preferencias, contexto clínico, indicaciones…"
                    value={field.state.value}
                    onChange={(event) => {
                      field.handleChange(event.target.value);
                    }}
                    onBlur={field.handleBlur}
                  />
                </div>
              )}
            </form.Field>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-3">
          {isEditing ? (
            <Button type="button" variant="destructive" onClick={() => setConfirmOpen(true)}>
              <Trash2 />
              Eliminar cliente
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                navigate(existing ? `/dashboard/clientes/${existing.id}` : '/dashboard/clientes');
              }}
            >
              Cancelar
            </Button>
            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <Button type="submit" disabled={!canSubmit || isSubmitting}>
                  {isSubmitting ? <LoaderCircle className="animate-spin" /> : null}
                  {isEditing ? 'Guardar cambios' : 'Crear cliente'}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </div>
      </form>

      <Dialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="¿Eliminar este cliente?"
        description="Se borrarán también sus seguimientos, oportunidades, citas e interacciones. Esta acción no se puede deshacer."
      >
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
            Cancelar
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete}>
            <Trash2 />
            Eliminar definitivamente
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

/** Input auxiliar para agregar etiquetas personalizadas. */
function TagAddInput({ onAdd }: { onAdd: (tag: string) => void }) {
  const [value, setValue] = useState('');

  return (
    <>
      <Input
        aria-label="Nueva etiqueta"
        placeholder="Agregar etiqueta personalizada"
        className="max-w-64"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            const tag = value.trim();
            if (tag) {
              onAdd(tag);
              setValue('');
            }
          }
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          const tag = value.trim();
          if (tag) {
            onAdd(tag);
            setValue('');
          }
        }}
      >
        <Plus />
        Agregar
      </Button>
    </>
  );
}

export { ClientFormPage };
