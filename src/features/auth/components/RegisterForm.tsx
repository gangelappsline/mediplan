import {
  Briefcase,
  Eye,
  EyeOff,
  HeartPulse,
  LoaderCircle,
  Lock,
  Mail,
  Smile,
  Sparkles,
  Stethoscope,
  User,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import { useRegister } from '@/features/auth/hooks/useAuth';
import {
  acceptTermsFieldSchema,
  clinicNameFieldSchema,
  confirmPasswordFieldSchema,
  emailFieldSchema,
  nameFieldSchema,
  passwordFieldSchema,
  professionalTypeFieldSchema,
  registerSchema,
  type RegisterValues,
} from '@/features/auth/schemas';
import type { CrmIcon } from '@/features/crm/labels';
import { FieldErrors } from '@/shared/components/FieldErrors';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { useAppForm } from '@/shared/hooks/useAppForm';
import { cn } from '@/shared/lib/utils';
import type { ProfessionalType } from '@/types';

const professionalTypeOptions: ReadonlyArray<{
  value: ProfessionalType;
  label: string;
  icon: CrmIcon;
}> = [
  { value: 'dentist', label: 'Dentista', icon: Smile },
  { value: 'doctor', label: 'Doctor', icon: Stethoscope },
  { value: 'nurse', label: 'Enfermería', icon: HeartPulse },
  { value: 'esthetician', label: 'Estética', icon: Sparkles },
  { value: 'other', label: 'Otro', icon: Briefcase },
];

function handlePlaceholderLink(event: { preventDefault: () => void }) {
  event.preventDefault();
  toast.info('Este documento estará disponible próximamente.');
}

interface StrengthResult {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  barClass: string;
  textClass: string;
}

const strengthMeta: Record<StrengthResult['score'], Omit<StrengthResult, 'score'>> = {
  0: { label: 'Muy débil', barClass: 'bg-rose-500', textClass: 'text-rose-600 dark:text-rose-400' },
  1: { label: 'Débil', barClass: 'bg-rose-500', textClass: 'text-rose-600 dark:text-rose-400' },
  2: { label: 'Aceptable', barClass: 'bg-amber-500', textClass: 'text-amber-600 dark:text-amber-400' },
  3: { label: 'Fuerte', barClass: 'bg-sky-500', textClass: 'text-sky-600 dark:text-sky-400' },
  4: { label: 'Excelente', barClass: 'bg-emerald-500', textClass: 'text-emerald-600 dark:text-emerald-400' },
};

/** Evalúa la fortaleza de la contraseña (longitud, mayúsculas, números, símbolos). */
function passwordStrength(password: string): StrengthResult {
  if (!password) {
    return { score: 0, label: ' ', barClass: 'bg-muted', textClass: 'text-muted-foreground' };
  }

  let points = 0;
  if (password.length >= 8) points += 1;
  if (password.length >= 12) points += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) points += 1;
  if (/\d/.test(password)) points += 1;
  if (/[^a-zA-Z0-9]/.test(password)) points += 1;
  const score = Math.min(points, 4) as StrengthResult['score'];
  return { score, ...strengthMeta[score] };
}

/** Formulario de registro con medidor de contraseña y selector de perfil. */
function RegisterForm() {
  const register = useRegister();
  const [showPassword, setShowPassword] = useState(false);

  const form = useAppForm<RegisterValues>({
    schema: registerSchema,
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      professionalType: 'dentist',
      clinicName: '',
      acceptTerms: false,
    },
    onSubmit: (values) => {
      register.mutate({
        name: values.name,
        email: values.email,
        password: values.password,
        professionalType: values.professionalType,
        clinicName: values.clinicName?.trim() ? values.clinicName.trim() : undefined,
      });
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    void form.handleSubmit();
  }

  return (
    <div className="space-y-7">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Crea tu cuenta</h1>
        <p className="text-muted-foreground">Empieza a gestionar tu clínica en minutos.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Sección: cuenta */}
        <div className="space-y-4">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">
              1
            </span>
            Tu cuenta
          </p>

          <form.Field name="name" validators={{ onChange: nameFieldSchema, onBlur: nameFieldSchema }}>
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Nombre completo</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id={field.name}
                    name={field.name}
                    type="text"
                    autoComplete="name"
                    placeholder="Dra. Ana García"
                    className="pl-9"
                    value={field.state.value}
                    onChange={(event) => {
                      field.handleChange(event.target.value);
                    }}
                    onBlur={field.handleBlur}
                    aria-invalid={!field.state.meta.isValid}
                  />
                </div>
                <FieldErrors errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>

          <form.Field
            name="email"
            validators={{ onChange: emailFieldSchema, onBlur: emailFieldSchema }}
          >
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Correo electrónico</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id={field.name}
                    name={field.name}
                    type="email"
                    autoComplete="email"
                    placeholder="tu@clinica.com"
                    className="pl-9"
                    value={field.state.value}
                    onChange={(event) => {
                      field.handleChange(event.target.value);
                    }}
                    onBlur={field.handleBlur}
                    aria-invalid={!field.state.meta.isValid}
                  />
                </div>
                <FieldErrors errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <form.Field
              name="password"
              validators={{ onChange: passwordFieldSchema, onBlur: passwordFieldSchema }}
            >
              {(field) => {
                const strength = passwordStrength(field.state.value);

                return (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Contraseña</Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id={field.name}
                        name={field.name}
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Mínimo 8 caracteres"
                        className="pr-10 pl-9"
                        value={field.state.value}
                        onChange={(event) => {
                          field.handleChange(event.target.value);
                        }}
                        onBlur={field.handleBlur}
                        aria-invalid={!field.state.meta.isValid}
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
                        onClick={() => {
                          setShowPassword((visible) => !visible);
                        }}
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>

                    {/* Medidor de fortaleza */}
                    <div className="flex items-center gap-2" aria-hidden="true">
                      <div className="flex h-1.5 flex-1 gap-1">
                        {[1, 2, 3, 4].map((step) => (
                          <span
                            key={step}
                            className={cn(
                              'h-full flex-1 rounded-full transition-colors',
                              strength.score >= step ? strength.barClass : 'bg-muted',
                            )}
                          />
                        ))}
                      </div>
                      <span className={cn('w-16 text-right text-xs font-medium', strength.textClass)}>
                        {strength.label}
                      </span>
                    </div>

                    <FieldErrors errors={field.state.meta.errors} />
                  </div>
                );
              }}
            </form.Field>

            <form.Field
              name="confirmPassword"
              validators={{ onChange: confirmPasswordFieldSchema, onBlur: confirmPasswordFieldSchema }}
            >
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Confirmar contraseña</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id={field.name}
                      name={field.name}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Repite tu contraseña"
                      className="pl-9"
                      value={field.state.value}
                      onChange={(event) => {
                        field.handleChange(event.target.value);
                      }}
                      onBlur={field.handleBlur}
                      aria-invalid={!field.state.meta.isValid}
                    />
                  </div>
                  <FieldErrors errors={field.state.meta.errors} />
                </div>
              )}
            </form.Field>
          </div>
        </div>

        {/* Sección: perfil profesional */}
        <div className="space-y-4">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">
              2
            </span>
            Tu perfil profesional
          </p>

          <form.Field
            name="professionalType"
            validators={{
              onChange: professionalTypeFieldSchema,
              onBlur: professionalTypeFieldSchema,
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <Label id="professional-type-label">¿A qué te dedicas?</Label>
                <div
                  role="radiogroup"
                  aria-labelledby="professional-type-label"
                  className="grid grid-cols-2 gap-2 sm:grid-cols-5"
                >
                  {professionalTypeOptions.map((option) => {
                    const isSelected = field.state.value === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => {
                          field.handleChange(option.value);
                        }}
                        onBlur={field.handleBlur}
                        className={cn(
                          'flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-medium transition-all outline-none',
                          'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary shadow-xs'
                            : 'border-border text-muted-foreground hover:border-primary/40 hover:bg-muted hover:text-foreground',
                        )}
                      >
                        <option.icon className="size-5" />
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                <FieldErrors errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>

          <form.Field
            name="clinicName"
            validators={{ onChange: clinicNameFieldSchema, onBlur: clinicNameFieldSchema }}
          >
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>
                  Nombre de la clínica / consultorio{' '}
                  <span className="font-normal text-muted-foreground">(opcional)</span>
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="text"
                  autoComplete="organization"
                  placeholder="Clínica Dental Sonrisa"
                  value={field.state.value ?? ''}
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

        <form.Field
          name="acceptTerms"
          validators={{ onChange: acceptTermsFieldSchema, onBlur: acceptTermsFieldSchema }}
        >
          {(field) => (
            <div className="space-y-2">
              <div className="flex items-start gap-2.5">
                <Checkbox
                  id={field.name}
                  checked={field.state.value}
                  onCheckedChange={(checked) => {
                    field.handleChange(checked === true);
                  }}
                  onBlur={field.handleBlur}
                  aria-invalid={!field.state.meta.isValid}
                  className="mt-0.5"
                />
                <Label htmlFor={field.name} className="text-sm leading-snug font-normal">
                  Acepto los{' '}
                  <a
                    href="#"
                    onClick={handlePlaceholderLink}
                    className="text-primary underline underline-offset-2"
                  >
                    términos y condiciones
                  </a>{' '}
                  y la{' '}
                  <a
                    href="#"
                    onClick={handlePlaceholderLink}
                    className="text-primary underline underline-offset-2"
                  >
                    política de privacidad
                  </a>
                </Label>
              </div>
              <FieldErrors errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>

        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
          {([canSubmit, isSubmitting]) => {
            const isBusy = isSubmitting || register.isPending;

            return (
              <Button type="submit" size="lg" className="w-full" disabled={!canSubmit || isBusy}>
                {isBusy ? (
                  <>
                    <LoaderCircle className="animate-spin" />
                    Creando cuenta…
                  </>
                ) : (
                  'Crear cuenta gratis'
                )}
              </Button>
            );
          }}
        </form.Subscribe>
      </form>

      {/* Confianza */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          14 días gratis
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          Sin tarjeta de crédito
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          Cancela cuando quieras
        </span>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{' '}
        <Link
          to="/login"
          className="font-medium text-primary underline-offset-2 transition-colors hover:underline"
        >
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}

export { RegisterForm };
