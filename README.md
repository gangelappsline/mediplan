# MediPlan — La agenda inteligente para tu clínica

Panel web (SPA) para profesionales de la salud y la estética: agenda de citas, CRM de
clientes y leads, y área personal para pacientes. Se conecta a la **API REST de MediPlan**
(`/api`, autenticación con Bearer de Laravel Passport) y sincroniza WhatsApp con la API
oficial de Meta.

> **Fase actual:** cobertura completa de los **47 endpoints** de la API de MediPlan:
> autenticación (4), panel de negocio (24), área de cliente (4) y panel de administración (15).
> Cada pantalla usa su petición real; no hay datos simulados ni `localStorage` para el CRM.

## Integración con la API de MediPlan

La especificación OpenAPI vive en `https://mediplan-api.appsline.com.mx/docs?api-docs.json`.
El cliente HTTP está en `src/shared/api/`:

- `http.ts` — `apiRequest()`: JSON (`Content-Type: application/json` solo cuando hay cuerpo),
  `Accept: application/json` y `Authorization: Bearer <token>` en cada petición. Los errores
  se normalizan en `ApiError` (`status`, mensaje en español y `errors` de los 422).
- `session.ts` — sesión persistida (`mediplan-auth`) y suscripción reactiva. Un 401 en una
  petición autenticada cierra la sesión.
- `resources.ts` — helpers que desempaquetan `{ message, data, meta }`, limpian filtros vacíos y
  omiten campos `undefined` en los cuerpos.

Por el proxy de Vite, el navegador llama a `/api/...` y el servidor de desarrollo o `vite preview`
lo reenvía a `VITE_API_PROXY_TARGET` (por defecto `https://mediplan-api.appsline.com.mx`), sin CORS.
Si la API está en otro origen en producción, define `VITE_API_BASE_URL`.

### Endpoints por módulo

| Módulo | Archivo de la API | Endpoints |
| --- | --- | --- |
| Autenticación | `src/features/auth/api.ts` | `POST /register`, `POST /login`, `POST /logout`, `GET /me` |
| Negocio | `src/features/business/api.ts` | `GET /business/dashboard`; `GET\|POST /business/clients`; `GET\|PUT\|DELETE /business/clients/{client}`; `GET\|POST /business/leads`; `GET\|PUT\|DELETE /business/leads/{lead}`; `PATCH /business/leads/{lead}/status`; `POST /business/leads/{lead}/convert`; `GET\|POST /business/appointments`; `GET /business/appointments/agenda`; `GET\|PUT\|DELETE /business/appointments/{appointment}`; `PATCH /business/appointments/{appointment}/status`; `GET\|PUT /business/profile`; `GET\|PUT /business/settings` |
| Cliente | `src/features/cliente/api.ts` | `GET /client/dashboard`; `GET /client/appointments`; `GET /client/appointments/{appointment}`; `PATCH /client/appointments/{appointment}/cancel` |
| Administrador | `src/features/admin/api.ts` | `GET /admin/dashboard`; `GET\|POST /admin/users`; `GET\|PUT\|DELETE /admin/users/{user}`; `PATCH /admin/users/{user}/status`; `PUT /admin/users/{user}/roles`; `GET /admin/businesses`; `GET\|PUT\|DELETE /admin/businesses/{business}`; `PATCH /admin/businesses/{business}/status`; `GET /admin/leads`; `GET /admin/roles` |

### Validación y formato de datos

Los esquemas Zod (`schemas.ts` de cada módulo) replican las reglas de la spec antes de enviar:

- Leads: requieren correo **o** teléfono; `estimated_value` con hasta 2 decimales.
- Citas: `ends_at` posterior a `starts_at`; las fechas locales (`datetime-local`) se convierten a
  ISO 8601 UTC. Al editar, el estado se cambia con su propio endpoint (`PATCH …/status`); cancelar
  exige `cancel_reason`.
- Configuración: duración 5–480, intervalo 5–240, aviso mínimo 0–10080, anticipación 1–365 días,
  moneda de 3 letras y horario `HH:MM` por día con cierre posterior a apertura.
- Admin: contraseña de 8+ caracteres con confirmación; el campo `role` acepta
  `cliente | negocio | administrador`.
- Los errores 422 muestran el primer mensaje de validación devuelto por la API.

### Rutas por rol

Cada panel está protegido por `RequireRole` (`src/features/auth/components/RequireRole.tsx`): sin
sesión redirige a `/login`; con un rol que no corresponde, redirige al inicio de su rol.

## Rutas

| Ruta | Rol | Descripción |
| --- | --- | --- |
| `/` | público | Landing |
| `/login`, `/register` | público | Inicio de sesión y registro (`cliente` o `negocio`) |
| `/dashboard` | `business` | Resumen del negocio (`GET /business/dashboard`) |
| `/dashboard/agenda` | `business` | Agenda semanal (`/business/appointments/agenda`) o listado (`/business/appointments`) |
| `/dashboard/agenda/citas/:id` | `business` | Detalle de cita: editar, cambiar estado, eliminar |
| `/dashboard/clientes` | `business` | Clientes: búsqueda, estado, orden y paginación |
| `/dashboard/clientes/nuevo`, `/:id`, `/:id/editar` | `business` | Alta, ficha (con sus citas) y edición de cliente |
| `/dashboard/pipeline` | `business` | Leads: búsqueda, estado, orden y paginación |
| `/dashboard/pipeline/nuevo`, `/:id`, `/:id/editar` | `business` | Alta, detalle (estado, conversión, eliminar) y edición de lead |
| `/dashboard/seguimientos` | `business` | Leads abiertos por fecha de seguimiento (vencidos, hoy, 7 días) |
| `/dashboard/whatsapp` | `business` | Sincronización con WhatsApp Cloud API |
| `/dashboard/reportes` | `business` | Métricas, actividad mensual y pipeline |
| `/dashboard/configuracion` | `business` | Perfil del negocio y reglas de agenda |
| `/cuenta` | `client` | Resumen del cliente |
| `/cuenta/citas`, `/cuenta/citas/:id` | `client` | Mis citas y cancelación |
| `/admin` | `admin` | Resumen de la plataforma |
| `/admin/usuarios`, `/nuevo`, `/:id`, `/:id/editar` | `admin` | Usuarios: listado, alta, detalle, roles, activar/desactivar, eliminar |
| `/admin/negocios`, `/admin/negocios/:id` | `admin` | Negocios: listado, edición, estado y eliminación |
| `/admin/leads` | `admin` | Leads de todos los negocios |
| `/admin/roles` | `admin` | Catálogo de roles |
| `*` | público | Página 404 |

## Estructura de carpetas

```text
src/
├── app/
│   ├── router.tsx                    # Rutas públicas y paneles por rol (lazy loading)
│   └── providers.tsx                 # QueryClientProvider, ThemeProvider, Toaster
├── features/
│   ├── landing/                      # Landing pública
│   ├── auth/                         # api, schemas, roles, hooks, LoginForm/RegisterForm, RequireRole
│   ├── panel/                        # PanelShell (sidebar + header), navegación y layouts por rol
│   ├── business/                     # Panel de negocio: api, schemas, hooks, labels, components, pages
│   ├── cliente/                      # Área de cliente: api, hooks, components, pages
│   ├── admin/                        # Administración: api, schemas, hooks, components, pages
│   └── whatsapp/                     # Cloud API: formulario, guía y envíos (sin cambios de alcance)
├── server/
│   └── whatsappPlugin.ts             # Plugin de Vite con los endpoints /api/whatsapp/*
├── shared/
│   ├── api/                          # http.ts, session.ts, resources.ts
│   ├── components/
│   │   ├── form/Fields.tsx           # TextField, TextAreaField, SelectField, CheckboxField (TanStack Form)
│   │   ├── ui/                       # Button, Input, Label, Card, Checkbox, Select, Badge, Dialog, Tabs…
│   │   ├── layout/                   # RootLayout, MarketingLayout, AuthLayout
│   │   ├── ApiErrorAlert, QueryState, Pagination, StatCard, StatusBadge, Avatar, Charts, ConfirmDialog
│   │   ├── LinkButton.tsx, PageHeader.tsx, EmptyState.tsx, FieldErrors.tsx, Logo.tsx, ThemeProvider.tsx
│   ├── hooks/                        # useAppForm, useDebouncedValue, useReducedMotion
│   ├── lib/                          # format.ts (fechas, moneda, ISO↔datetime-local), queryClient.ts, utils.ts
│   └── pages/NotFoundPage.tsx
├── types/index.ts                    # Tipos alineados con la spec (respuestas, payloads, enums)
├── index.css                         # Tema Tailwind v4 (light/dark)
└── main.tsx
```

## Puesta en marcha

```bash
npm install
cp .env.example .env   # opcional: ajusta VITE_API_PROXY_TARGET o las variables de WhatsApp
npm run dev            # http://localhost:5173
```

| Script | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo (escucha en `0.0.0.0`) |
| `npm run build` | Typecheck + build de producción (`dist/`) |
| `npm run preview` | Previsualiza el build de producción (`0.0.0.0:4173`) |
| `npm run typecheck` | TypeScript en modo proyecto (`tsc -b`, strict) |

Variables del frontend (ver `.env.example`):

```bash
VITE_API_PROXY_TARGET=https://mediplan-api.appsline.com.mx   # destino del proxy /api
# VITE_API_BASE_URL=https://api.ejemplo.com/api              # solo si no se usa el proxy
```

## Stack tecnológico

| Capa | Tecnología |
| --- | --- |
| Core | React 19 + Vite 6 + TypeScript 5.5 (strict) |
| Routing | React Router DOM v7 (`createBrowserRouter` con lazy loading) |
| Estado del servidor | TanStack Query v5 |
| Formularios | TanStack Form v1 (vía `useAppForm`) |
| Validación | Zod 4 (Standard Schema) |
| Estilos | Tailwind CSS v4 (`@tailwindcss/vite`) + componentes estilo shadcn/ui |
| Animaciones | Motion v12 (`motion/react`) respetando `prefers-reduced-motion` |
| Notificaciones | Sonner |
| Iconos | Lucide React |

### Nota sobre `@tanstack/zod-form-adapter`

La spec original sugería `@tanstack/zod-form-adapter`, pero ese paquete quedó obsoleto
(estancado en `0.42.x`, con peer de Zod 3 e incompatible con TanStack Form v1). **TanStack
Form v1 soporta Standard Schema de forma nativa**: los esquemas Zod se pasan directamente en
`validators` (a nivel de campo y de formulario) y sus errores se propagan a cada campo
automáticamente. Es el patrón oficial actual y el que usa este proyecto en
`src/shared/hooks/useAppForm.ts`.

> Lucide v1 también renombró algunos iconos (`BarChart3` → `ChartColumn`, `Loader2` →
> `LoaderCircle`); se usan los nombres actuales.

## WhatsApp (API de Meta)

En `/dashboard/whatsapp` la clínica sincroniza su número con **WhatsApp Cloud API**
(`https://graph.facebook.com`, por defecto `v26.0`). No hay modo simulado: si Meta rechaza
el token o el Phone number ID, la cuenta no queda conectada.

Hay dos caminos:

1. **Credenciales de Cloud API** — token permanente de un usuario del sistema, Phone number ID
   y, recomendado, WABA ID. Es el camino que funciona con la app propia de la clínica.
2. **Embedded Signup v4** — botón «Continuar con Facebook». Requiere `META_APP_ID`,
   `META_APP_SECRET` y `META_CONFIG_ID` (o pegarlos una vez en el formulario). v2 y v3 caducan
   el 15 de octubre de 2026.

Las llamadas salen del servidor de MediPlan si puede llegar a `graph.facebook.com`. Si no
(por ejemplo en un entorno sin salida a Facebook), el navegador llama a Graph API directamente
y el token queda solo en ese navegador. El App Secret no se incluye en el bundle.

Variables opcionales en `.env` (ver `.env.example`):

```bash
META_APP_ID=
META_APP_SECRET=
META_CONFIG_ID=
META_SOLUTION_ID=
META_GRAPH_VERSION=v26.0
META_WEBHOOK_VERIFY_TOKEN=
```

El webhook de Meta es `POST/GET /api/whatsapp/webhook`. Los tokens guardados en el servidor
viven en `data/` (ignorado por git). La guía paso a paso, con las pantallas actuales de Meta,
está dentro del propio panel.

## Accesibilidad y animaciones

- Inputs con `<Label>` asociado, `aria-invalid` y errores con `role="alert"`.
- Toggle de precios con `aria-pressed`, menú móvil con `aria-expanded/controls`.
- Todas las animaciones de Motion se desactivan con `useReducedMotion()`
  (`prefers-reduced-motion: reduce`), incluido el `scroll-behavior` del CSS.
- Tema claro/oscuro con persistencia en `localStorage` y respeto del sistema.

## Convenios

- Componentes funcionales con props tipadas explícitas (sin `React.FC`).
- Nombres de archivo en PascalCase para componentes y camelCase para hooks/utilidades.
- Imports con alias `@/` → `src/` (configurado en `vite.config.ts` y `tsconfig.app.json`).
- TypeScript `strict` + `noUnusedLocals/Parameters`; `npm run typecheck` es obligatorio antes
  de commit.
- Las peticiones pasan siempre por `apiRequest`; las consultas usan `queryOptions` y las
  mutaciones invalidan el espacio de claves de su módulo.
