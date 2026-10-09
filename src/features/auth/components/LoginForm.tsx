import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import { useLogin } from '@/features/auth/hooks/useAuth';
import {
  emailFieldSchema,
  loginSchema,
  passwordFieldSchema,
  type LoginValues,
} from '@/features/auth/schemas';
import { FieldErrors } from '@/shared/components/FieldErrors';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { useAppForm } from '@/shared/hooks/useAppForm';

function LoginForm() {
  const login = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const form = useAppForm<LoginValues>({
    schema: loginSchema,
    defaultValues: {
      email: '',
      password: '',
    },
    onSubmit: (values) => {
      login.mutate(values);
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    void form.handleSubmit();
  }

  return (
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
            <Input
              id={field.name}
              name={field.name}
              type="email"
              autoComplete="email"
              placeholder="tu@clinica.com"
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
              <Input
                id={field.name}
                name={field.name}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Mínimo 8 caracteres"
                className="pr-10"
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

      <p className="text-center text-sm text-muted-foreground">
        ¿No tienes cuenta?{' '}
        <Link
          to="/register"
          className="font-medium text-primary underline-offset-2 transition-colors hover:underline"
        >
          Regístrate
        </Link>
      </p>
    </form>
  );
}

export { LoginForm };
