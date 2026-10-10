import { apiRequest } from '@/shared/api/http';
import { clearSession, getSession, saveSession } from '@/shared/api/session';
import type {
  AuthResponse,
  LoginPayload,
  MeResponse,
  MessageResponse,
  RegisterPayload,
  User,
} from '@/types';

/**
 * Endpoints de autenticación: `POST /register`, `POST /login`,
 * `POST /logout` y `GET /me`. Los tokens son de Laravel Passport.
 */

/** `POST /login` — guarda el token y el usuario en la sesión. */
export async function loginRequest(payload: LoginPayload): Promise<User> {
  const response = await apiRequest<AuthResponse>('/login', {
    method: 'POST',
    body: { email: payload.email.trim(), password: payload.password },
    auth: false,
  });

  saveSession({ token: response.data.token, user: response.data.user });
  return response.data.user;
}

/** `POST /register` — solo permite los roles `cliente` y `negocio`. */
export async function registerRequest(payload: RegisterPayload): Promise<User> {
  const response = await apiRequest<AuthResponse>('/register', {
    method: 'POST',
    body: {
      name: payload.name.trim(),
      email: payload.email.trim(),
      password: payload.password,
      password_confirmation: payload.password_confirmation,
      role: payload.role,
    },
    auth: false,
  });

  saveSession({ token: response.data.token, user: response.data.user });
  return response.data.user;
}

/**
 * `POST /logout` — revoca solo el token actual. La sesión local se elimina
 * siempre, aunque la petición falle (por ejemplo, si el token ya expiró).
 */
export async function logoutRequest(): Promise<void> {
  try {
    await apiRequest<MessageResponse>('/logout', { method: 'POST' });
  } finally {
    clearSession();
  }
}

/** `GET /me` — refresca el usuario (y sus roles) de la sesión activa. */
export async function meRequest(): Promise<User> {
  const response = await apiRequest<MeResponse>('/me');
  const session = getSession();

  if (session) {
    saveSession({ token: session.token, user: response.data.user });
  }

  return response.data.user;
}
