import { Eye, EyeOff, LoaderCircle, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

import { useLogin } from '@/features/auth/hooks/useAuth';
import {
  emailFieldSchema,
  loginPasswordFieldSchema,
  loginSchema,
  type LoginValues,
} from '@/features/auth/schemas';
import { FieldErrors } from '@/shared/components/FieldErrors';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { useAppForm } from '@/shared/hooks/useAppForm';

const REMEMBER_EMAIL_KEY = 'mediplan-remember-email';

function readRememberedEmail(): string {
  try {
    return window.localStorage.getItem(REMEMBER_EMAIL_KEY) ?? '';
  } catch {
    return '';
  }
}

/** Formulario de inicio de sesión contra `POST /login`. */
function LoginForm() {
  const login = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(() => readRememberedEmail() !== '');

  const form = useAppForm<LoginValues>({
    schema: loginSchema,
    defaultValues: {
      email: readRememberedEmail(),
      password: '',
    },
    onSubmit: (values) => {
      try {
        if (remember) {
          window.localStorage.setItem(REMEMBER_EMAIL_KEY, values.email.trim());
        } else {
          window.localStorage.removeItem(REMEMBER_EMAIL_KEY);
        }
      } catch {
        // El almacenamiento puede no estar disponible (modo privado).
      }
      login.mutate(values);
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
        <h1 className="text-3xl font-bold tracking-tight">Bienvenido de nuevo</h1>
        <p className="text-muted-foreground">Accede a tu cuenta para continuar.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
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

        <form.Field
          name="password"
          validators={{ onChange: loginPasswordFieldSchema, onBlur: loginPasswordFieldSchema }}
        >
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Contraseña</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id={field.name}
                  name={field.name}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Tu contraseña"
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
              <FieldErrors errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>

        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-muted-foreground">
          <Checkbox
            checked={remember}
            onCheckedChange={(checked) => {
              setRemember(checked === true);
            }}
            aria-label="Recordar mi correo"
          />
          Recordarme en este dispositivo
        </label>

        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
          {([canSubmit, isSubmitting]) => {
            const isBusy = isSubmitting || login.isPending;

            return (
              <Button type="submit" size="lg" className="w-full" disabled={!canSubmit || isBusy}>
                {isBusy ? (
                  <>
                    <LoaderCircle className="animate-spin" />
                    Iniciando sesión…
                  </>
                ) : (
                  'Iniciar sesión'
                )}
              </Button>
            );
          }}
        </form.Subscribe>
      </form>

      <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5 text-emerald-500" />
        Conexión segura con el servidor de MediPlan
      </div>

      <p className="text-center text-sm text-muted-foreground">
        ¿No tienes cuenta?{' '}
        <Link
          to="/register"
          className="font-medium text-primary underline-offset-2 transition-colors hover:underline"
        >
          Regístrate gratis
        </Link>
      </p>
    </div>
  );
}

export { LoginForm };
