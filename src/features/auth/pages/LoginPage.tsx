import { LoginForm } from '@/features/auth/components/LoginForm';

/** Página de inicio de sesión (`/login`). */
function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Iniciar sesión</h1>
        <p className="text-sm text-muted-foreground">
          Accede a tu cuenta para gestionar tu clínica.
        </p>
      </div>
      <LoginForm />
    </div>
  );
}

export { LoginPage };
