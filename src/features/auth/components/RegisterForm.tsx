import { Eye, EyeOff, LoaderCircle, Lock, Mail, Stethoscope, User, UserRound } from 'lucide-react';
import { useState, type ComponentType, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import { useRegister } from '@/features/auth/hooks/useAuth';
import {
  acceptTermsFieldSchema,
  confirmPasswordFieldSchema,
  emailFieldSchema,
  nameFieldSchema,
  passwordFieldSchema,
  registerSchema,
  roleFieldSchema,
  type RegisterValues,
} from '@/features/auth/schemas';
import { FieldErrors } from '@/shared/components/FieldErrors';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { useAppForm } from '@/shared/hooks/useAppForm';
import { cn } from '@/shared/lib/utils';

type AccountRole = 'cliente' | 'negocio';

const roleOptions: ReadonlyArray<{
  value: AccountRole;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  {
    value: 'negocio',
    label: 'Negocio',
    description: 'Clínica o consultorio: agenda, clientes y leads.',
    icon: Stethoscope,
  },
  {
    value: 'cliente',
    label: 'Cliente',
    description: 'Consulta y gestiona tus citas.',
    icon: UserRound,
  },
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

/** Formulario de registro contra `POST /register` (roles cliente y negocio). */
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
      role: 'negocio',
      acceptTerms: false,
    },
    onSubmit: (values) => {
      register.mutate({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        password_confirmation: values.confirmPassword,
        role: values.role,
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
        <p className="text-muted-foreground">Empieza a organizar tu agenda en minutos.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div className="space-y-4">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">
              1
            </span>
            Tus datos
          </p>

          <form.Field
            name="name"
            validators={{ onChange: nameFieldSchema, onBlur: nameFieldSchema }}
          >
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Nombre completo</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id={field.name}
                    name={field.name}
                    autoComplete="name"
                    placeholder="Ana Gabriela Torres"
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
                    placeholder="tu@correo.com"
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

        <div className="space-y-4">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">
              2
            </span>
            ¿Qué tipo de cuenta necesitas?
          </p>

          <form.Field
            name="role"
            validators={{ onChange: roleFieldSchema, onBlur: roleFieldSchema }}
          >
            {(field) => (
              <div className="space-y-2">
                <Label id="account-role-label">Tipo de cuenta</Label>
                <div role="radiogroup" aria-labelledby="account-role-label" className="grid gap-2 sm:grid-cols-2">
                  {roleOptions.map((option) => {
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
                          'flex items-start gap-3 rounded-xl border p-3 text-left transition-all outline-none',
                          'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary shadow-xs'
                            : 'border-border text-muted-foreground hover:border-primary/40 hover:bg-muted hover:text-foreground',
                        )}
                      >
                        <option.icon className="mt-0.5 size-5 shrink-0" />
                        <span className="space-y-0.5">
                          <span className="block text-sm font-medium">{option.label}</span>
                          <span className="block text-xs text-muted-foreground">{option.description}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
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
                  'Crear cuenta'
                )}
              </Button>
            );
          }}
        </form.Subscribe>
      </form>

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
