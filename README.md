# MediPlan — La agenda inteligente para tu clínica

Sistema de gestión (SPA) para profesionales de la salud y la estética: agenda de citas,
seguimiento de pacientes y notificaciones de promociones y descuentos.

> **Fase actual:** Landing, autenticación y panel de clínica con sincronización de WhatsApp
> contra la API oficial de Meta (Cloud API / Graph API). La agenda y el seguimiento de
> pacientes siguen preparados como fases posteriores.

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

## Puesta en marcha

```bash
npm install
npm run dev        # http://localhost:5173
```

| Script | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Typecheck + build de producción (`dist/`) |
| `npm run preview` | Previsualiza el build de producción |
| `npm run typecheck` | TypeScript en modo proyecto (`tsc -b`, strict) |

## Estructura de carpetas

```text
src/
├── app/
│   ├── router.tsx                    # createBrowserRouter con lazy loading por ruta
│   └── providers.tsx                 # QueryClientProvider, ThemeProvider, Toaster
├── features/
│   ├── landing/
│   │   ├── components/
│   │   │   ├── HeroSection.tsx       # Headline + CTAs + mockup de agenda animado
│   │   │   ├── AgendaMockup.tsx      # Mockup con slots en stagger y badges flotantes
│   │   │   ├── FeaturesSection.tsx   # Agenda inteligente, seguimiento, notificaciones…
│   │   │   ├── PricingSection.tsx    # 3 planes con toggle mensual/anual
│   │   │   ├── TestimonialsSection.tsx
│   │   │   └── CTASection.tsx
│   │   └── pages/LandingPage.tsx
│   ├── auth/
│   │   ├── components/
│   │   │   ├── LoginForm.tsx         # TanStack Form + Zod + useMutation
│   │   │   └── RegisterForm.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts            # useLogin / useRegister (mutations)
│   │   ├── api.ts                    # API simulada (setTimeout + localStorage)
│   │   ├── schemas.ts                # Esquemas Zod (Standard Schema)
│   │   └── pages/
│   │       ├── LoginPage.tsx
│   │       └── RegisterPage.tsx
│   ├── dashboard/
│   │   ├── components/ClinicShell.tsx
│   │   └── pages/                    # Resumen y layout del panel
│   └── whatsapp/                     # Cloud API: formulario, guía y envíos
├── shared/
│   ├── components/
│   │   ├── ui/                       # Button, Input, Label, Card, Checkbox, Select, Badge
│   │   ├── layout/                   # Header, Footer, RootLayout, MarketingLayout, AuthLayout
│   │   ├── Logo.tsx
│   │   ├── ThemeProvider.tsx
│   │   └── FieldErrors.tsx           # role="alert" accesible
│   ├── hooks/
│   │   ├── useAppForm.ts             # Wrapper de TanStack Form (contexto compartido)
│   │   └── useReducedMotion.ts
│   ├── lib/
│   │   ├── queryClient.ts            # staleTime: 5 * 60 * 1000
│   │   ├── animations.ts             # Variants reutilizables de Motion
│   │   └── utils.ts                  # cn() para Tailwind
│   └── pages/NotFoundPage.tsx
├── types/
│   └── index.ts                      # User, AuthResponse, Appointment, Patient, Clinic…
├── index.css                         # Tema Tailwind v4 (light/dark, paleta clínica)
└── main.tsx
```

## Rutas

| Ruta | Descripción |
| --- | --- |
| `/` | Landing: hero, funciones, precios, testimonios y CTA |
| `/login` | Inicio de sesión (TanStack Form + Zod) |
| `/register` | Registro con tipo de profesional y aceptación de términos |
| `/dashboard` | Panel de la clínica: resumen y acceso a WhatsApp |
| `/dashboard/whatsapp` | Sincronización de WhatsApp con Graph API de Meta |
| `*` | Página 404 |

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

## Demo sin backend

Las llamadas de autenticación se simulan con `setTimeout` (≈900 ms) y la sesión se persiste en
`localStorage` (`mediplan-auth`).

- **Login:** cualquier email + contraseña de 8+ caracteres.
- **Forzar error de API:** usa el email `fail@mediplan.app` para ver el `toast.error()` de
  Sonner.
- Los CTAs de "recuperar contraseña" y los enlaces legales son placeholders informativos.

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
