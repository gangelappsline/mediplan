import { Building2, LoaderCircle, Mail, MapPin, Phone, RefreshCw, UserPlus, Users } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { useCrm } from '@/features/crm/hooks/useCrm';
import { Avatar } from '@/features/crm/components/Avatar';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
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

const PROFILE_STORAGE_KEY = 'mediplan-clinic-profile';

interface ClinicProfile {
  name: string;
  specialty: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  followUpDays: string;
  notes: string;
}

const defaultProfile: ClinicProfile = {
  name: '',
  specialty: 'Salud dental',
  phone: '',
  email: '',
  address: '',
  website: '',
  followUpDays: '3',
  notes: '',
};

const teamMembers = [
  { name: 'Dra. Ana García', role: 'Administradora', email: 'ana@mediplan.app' },
  { name: 'Laura Pérez', role: 'Recepción', email: 'laura@mediplan.app' },
  { name: 'Dr. Carlos Ruiz', role: 'Profesional', email: 'carlos@mediplan.app' },
] as const;

function loadProfile(): ClinicProfile {
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return defaultProfile;
    return { ...defaultProfile, ...(JSON.parse(raw) as Partial<ClinicProfile>) };
  } catch {
    return defaultProfile;
  }
}

/** Configuración del panel: perfil de la clínica, equipo y datos de demostración. */
function SettingsPage() {
  const { reset } = useCrm();
  const [profile, setProfile] = useState<ClinicProfile>(loadProfile);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof ClinicProfile>(key: K, value: ClinicProfile[K]) {
    setProfile((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    window.setTimeout(() => {
      setSaving(false);
      toast.success('Configuración guardada');
    }, 400);
  }

  function handleReset() {
    reset();
    toast.success('Datos de demostración restablecidos');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración"
        description="Ajusta el perfil de tu clínica, revisa tu equipo y administra los datos de demostración del CRM."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Perfil de la clínica</CardTitle>
            <CardDescription>
              Estos datos se usan en la ficha de clientes y en tus comunicaciones.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clinic-name">Nombre de la clínica</Label>
                <Input
                  id="clinic-name"
                  placeholder="Clínica Dental Sonrisa"
                  value={profile.name}
                  onChange={(event) => {
                    update('name', event.target.value);
                  }}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="clinic-specialty">Especialidad principal</Label>
                  <Select
                    value={profile.specialty}
                    onValueChange={(value) => {
                      update('specialty', value);
                    }}
                  >
                    <SelectTrigger id="clinic-specialty" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Salud dental">Salud dental</SelectItem>
                      <SelectItem value="Medicina general">Medicina general</SelectItem>
                      <SelectItem value="Estética">Estética</SelectItem>
                      <SelectItem value="Nutrición">Nutrición</SelectItem>
                      <SelectItem value="Fisioterapia">Fisioterapia</SelectItem>
                      <SelectItem value="Otra">Otra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinic-followup">Seguimiento por defecto</Label>
                  <Select
                    value={profile.followUpDays}
                    onValueChange={(value) => {
                      update('followUpDays', value);
                    }}
                  >
                    <SelectTrigger id="clinic-followup" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Cada día</SelectItem>
                      <SelectItem value="3">Cada 3 días</SelectItem>
                      <SelectItem value="7">Cada semana</SelectItem>
                      <SelectItem value="14">Cada 2 semanas</SelectItem>
                      <SelectItem value="30">Cada mes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="clinic-phone">Teléfono</Label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="clinic-phone"
                      type="tel"
                      className="pl-9"
                      placeholder="+52 55 0000 0000"
                      value={profile.phone}
                      onChange={(event) => {
                        update('phone', event.target.value);
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinic-email">Correo</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="clinic-email"
                      type="email"
                      className="pl-9"
                      placeholder="contacto@clinicadental.com"
                      value={profile.email}
                      onChange={(event) => {
                        update('email', event.target.value);
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clinic-address">Dirección</Label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="clinic-address"
                    className="pl-9"
                    placeholder="Av. Siempre Viva 742"
                    value={profile.address}
                    onChange={(event) => {
                      update('address', event.target.value);
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clinic-website">Sitio web</Label>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="clinic-website"
                    className="pl-9"
                    placeholder="https://clinicadental.com"
                    value={profile.website}
                    onChange={(event) => {
                      update('website', event.target.value);
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clinic-notes">
                  Notas internas <span className="font-normal text-muted-foreground">(opcional)</span>
                </Label>
                <Textarea
                  id="clinic-notes"
                  rows={3}
                  placeholder="Horarios, políticas de cancelación, convenios…"
                  value={profile.notes}
                  onChange={(event) => {
                    update('notes', event.target.value);
                  }}
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving ? <LoaderCircle className="animate-spin" /> : null}
                  Guardar cambios
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Equipo</CardTitle>
              <CardDescription>Personas con acceso al panel de la clínica.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {teamMembers.map((member) => (
                <div key={member.email} className="flex items-center gap-3">
                  <Avatar name={member.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{member.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                  </div>
                  <Badge variant="secondary">{member.role}</Badge>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  toast.info('Las invitaciones por correo estarán disponibles próximamente.');
                }}
              >
                <UserPlus />
                Invitar miembro
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Datos de demostración</CardTitle>
              <CardDescription>
                Este panel funciona con datos simulados en tu navegador. Puedes restablecerlos para
                volver al estado inicial de la demo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3 rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">
                <Users className="mt-0.5 size-4 shrink-0" />
                <p>
                  Clientes, seguimientos, oportunidades, citas e interacciones viven en el
                  almacenamiento local de este navegador. Nada sale de tu equipo.
                </p>
              </div>
              <Button type="button" variant="outline" className="w-full" onClick={handleReset}>
                <RefreshCw />
                Restablecer datos de demostración
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export { SettingsPage };
