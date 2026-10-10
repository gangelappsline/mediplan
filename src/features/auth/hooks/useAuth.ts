import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { loginRequest, logoutRequest, registerRequest } from '@/features/auth/api';
import { homePathForUser } from '@/features/auth/roles';
import { getErrorMessage } from '@/shared/api/http';
import { queryClient } from '@/shared/lib/queryClient';
import type { LoginPayload, RegisterPayload } from '@/types';

/** `POST /login`: redirige a la pantalla del rol del usuario. */
export function useLogin() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: LoginPayload) => loginRequest(payload),
    onSuccess: (user) => {
      // Evita mostrar datos cacheados de otra sesión.
      queryClient.clear();
      toast.success(`¡Bienvenido de nuevo, ${user.name}!`);
      navigate(homePathForUser(user) ?? '/', { replace: true });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'No pudimos iniciar sesión. Inténtalo de nuevo.'));
    },
  });
}

/** `POST /register`: crea la cuenta y entra directamente con su token. */
export function useRegister() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: RegisterPayload) => registerRequest(payload),
    onSuccess: (user) => {
      queryClient.clear();
      toast.success(`¡Cuenta creada! Bienvenido a MediPlan, ${user.name}.`);
      navigate(homePathForUser(user) ?? '/', { replace: true });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'No pudimos crear la cuenta. Inténtalo de nuevo.'));
    },
  });
}

/** `POST /logout`: revoca el token actual y vuelve a la landing. */
export function useLogout() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: logoutRequest,
    onSettled: () => {
      queryClient.clear();
      navigate('/', { replace: true });
    },
    onSuccess: () => {
      toast.success('Sesión cerrada correctamente.');
    },
  });
}
