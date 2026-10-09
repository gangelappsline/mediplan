import { RegisterForm } from '@/features/auth/components/RegisterForm';

/** Página de registro (`/register`). */
function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Crea tu cuenta</h1>
        <p className="text-sm text-muted-foreground">
          Empieza a gestionar tu clínica en minutos.
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}

export { RegisterPage };
