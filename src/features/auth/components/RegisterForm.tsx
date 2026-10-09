import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
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
import { FieldErrors } from '@/shared/components/FieldErrors';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { useAppForm } from '@/shared/hooks/useAppForm';
import type { ProfessionalType } from '@/types';

const professionalTypeOptions: ReadonlyArray<{ value: ProfessionalType; label: string }> = [
  { value: 'dentist', label: 'Dentista' },
  { value: 'doctor', label: 'Doctor' },
  { value: 'nurse', label: 'Enfermera' },
  { value: 'esthetician', label: 'Esteticista' },
  { value: 'other', label: 'Otro' },
];

function handlePlaceholderLink(event: { preventDefault: () => void }) {
  event.preventDefault();
  toast.info('Este documento estará disponible próximamente.');
}

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
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <form.Field name="name" validators={{ onChange: nameFieldSchema, onBlur: nameFieldSchema }}>
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>Nombre completo</Label>
            <Input
              id={field.name}
              name={field.name}
              type="text"
              autoComplete="name"
              placeholder="Dra. Ana García"
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
        name="email"
        validators={{ onChange: emailFieldSchema, onBlur: emailFieldSchema }}
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

      <div className="grid gap-5 sm:grid-cols-2">
        <form.Field
          name="password"
          validators={{ onChange: passwordFieldSchema, onBlur: passwordFieldSchema }}
        >
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Contraseña</Label>
              <div className="relative">
                <Input
                  id={field.name}
                  name={field.name}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
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

        <form.Field
          name="confirmPassword"
          validators={{
            onChange: ({ value, fieldApi }) => {
              if (!value) return undefined;
              const password = fieldApi.form.state.values.password;
              return value === password ? undefined : 'Las contraseñas no coinciden';
            },
            onBlur: confirmPasswordFieldSchema,
          }}
        >
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Confirmar contraseña</Label>
              <Input
                id={field.name}
                name={field.name}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Repite tu contraseña"
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

      <form.Field
        name="professionalType"
        validators={{
          onChange: professionalTypeFieldSchema,
          onBlur: professionalTypeFieldSchema,
        }}
      >
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>Tipo de profesional</Label>
            <Select
              value={field.state.value}
              onValueChange={(value) => {
                field.handleChange(value as ProfessionalType);
              }}
            >
              <SelectTrigger
                id={field.name}
                className="w-full"
                aria-invalid={!field.state.meta.isValid}
              >
                <SelectValue placeholder="Selecciona una opción" />
              </SelectTrigger>
              <SelectContent>
                {professionalTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{' '}
        <Link
          to="/login"
          className="font-medium text-primary underline-offset-2 transition-colors hover:underline"
        >
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}

export { RegisterForm };
