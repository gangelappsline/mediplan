import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { loginRequest, registerRequest } from '@/features/auth/api';
import type { LoginPayload, RegisterPayload } from '@/types';

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

/**
 * Mutación de inicio de sesión: simula la llamada a la API con TanStack
 * Query, notifica con Sonner y redirige al dashboard.
 */
export function useLogin() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: LoginPayload) => loginRequest(payload),
    onSuccess: (data) => {
      toast.success(`¡Bienvenido de nuevo, ${data.user.name}!`);
      navigate('/dashboard');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Error al iniciar sesión. Inténtalo de nuevo.'));
    },
  });
}

/**
 * Mutación de registro: simula la creación de la cuenta, notifica con Sonner
 * y redirige al dashboard.
 */
export function useRegister() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: RegisterPayload) => registerRequest(payload),
    onSuccess: (data) => {
      toast.success(`¡Cuenta creada! Bienvenido a MediPlan, ${data.user.name}.`);
      navigate('/dashboard');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Error al crear la cuenta. Inténtalo de nuevo.'));
    },
  });
}
