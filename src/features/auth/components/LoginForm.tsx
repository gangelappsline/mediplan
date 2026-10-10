import { Eye, EyeOff, LoaderCircle, Lock, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import { useLogin } from '@/features/auth/hooks/useAuth';
import { GoogleMark, MicrosoftMark } from '@/features/auth/components/SocialMarks';
import {
  emailFieldSchema,
  loginSchema,
  passwordFieldSchema,
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

/** Formulario de inicio de sesión con recordatorio de correo y acceso social. */
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

  function handleSocial(provider: string) {
    toast.info(`El acceso con ${provider} estará disponible próximamente.`);
  }

  return (
    <div className="space-y-7">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Bienvenido de nuevo</h1>
        <p className="text-muted-foreground">
          Accede a tu cuenta para gestionar tu clínica.
        </p>
      </div>

      {/* Acceso rápido */}
      <div className="grid grid-cols-2 gap-3">
        <Button type="button" variant="outline" onClick={() => handleSocial('Google')}>
          <GoogleMark />
          Google
        </Button>
        <Button type="button" variant="outline" onClick={() => handleSocial('Microsoft')}>
          <MicrosoftMark />
          Microsoft
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground uppercase">o con tu correo</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <form.Field
          name="email"
          validators={{
            onChange: emailFieldSchema,
            onBlur: emailFieldSchema,
          }}
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

        <form.Field
          name="password"
          validators={{
            onChange: passwordFieldSchema,
            onBlur: passwordFieldSchema,
          }}
        >
          {(field) => (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={field.name}>Contraseña</Label>
                <button
                  type="button"
                  className="text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-primary hover:underline"
                  onClick={() => {
                    toast.info('La recuperación de contraseña estará disponible próximamente.');
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
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

      {/* Pista de demostración */}
      <div className="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-sm">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">Modo demo:</span> entra con cualquier correo
          y contraseña de 8+ caracteres. Usa{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">fail@mediplan.app</code> para ver
          el manejo de errores.
        </p>
      </div>

      <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5 text-emerald-500" />
        Conexión segura · Tus datos se quedan en tu navegador
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
