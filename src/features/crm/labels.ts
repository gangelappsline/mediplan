import {
  AlarmClock,
  AtSign,
  Cake,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Clock,
  FileText,
  Gift,
  Globe,
  Handshake,
  HeartPulse,
  Mail,
  MessageCircle,
  Phone,
  PhoneCall,
  Sparkles,
  Star,
  Tag,
  UserRound,
  Users,
  Video,
} from 'lucide-react';
import type { ComponentType } from 'react';

import { FacebookMark, InstagramMark } from '@/features/crm/components/BrandMarks';
import type {
  ActivityKind,
  AppointmentStatus,
  ClientSource,
  ClientStatus,
  DealStage,
  FollowUpTask,
  TaskPriority,
  TaskType,
} from '@/features/crm/types';

/** Icono renderizable con `className` (Lucide o SVG propio de marca). */
export type CrmIcon = ComponentType<{ className?: string }>;

/* --------------------------------- Clientes -------------------------------- */

export const clientStatusMeta: Record<
  ClientStatus,
  { label: string; badgeClass: string; icon: CrmIcon }
> = {
  lead: {
    label: 'Lead',
    badgeClass: 'border-transparent bg-amber-500/15 text-amber-600 dark:text-amber-400',
    icon: AlarmClock,
  },
  active: {
    label: 'Activo',
    badgeClass: 'border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    icon: CheckCircle2,
  },
  inactive: {
    label: 'Inactivo',
    badgeClass: 'border-transparent bg-muted text-muted-foreground',
    icon: Clock,
  },
  vip: {
    label: 'VIP',
    badgeClass: 'border-transparent bg-primary/15 text-primary',
    icon: Star,
  },
};

export const clientSourceMeta: Record<ClientSource, { label: string; icon: CrmIcon }> = {
  whatsapp: { label: 'WhatsApp', icon: MessageCircle },
  instagram: { label: 'Instagram', icon: InstagramMark },
  facebook: { label: 'Facebook', icon: FacebookMark },
  referido: { label: 'Referido', icon: Handshake },
  web: { label: 'Sitio web', icon: Globe },
  llamada: { label: 'Llamada', icon: Phone },
  otro: { label: 'Otro', icon: Tag },
};

/** Etiquetas sugeridas para segmentar clientes en el CRM. */
export const suggestedTags = [
  'Ortodoncia',
  'Limpieza',
  'Estética',
  'Frecuente',
  'Referido',
  'Potencial',
  'Empresarial',
  'Urgente',
] as const;

/* ------------------------------- Interacciones ----------------------------- */

export const activityKindMeta: Record<ActivityKind, { label: string; icon: CrmIcon }> = {
  note: { label: 'Nota', icon: FileText },
  call: { label: 'Llamada', icon: PhoneCall },
  whatsapp: { label: 'WhatsApp', icon: MessageCircle },
  email: { label: 'Correo', icon: Mail },
  visit: { label: 'Visita', icon: Users },
  system: { label: 'Sistema', icon: Sparkles },
};

/* -------------------------------- Seguimientos ----------------------------- */

export const taskTypeMeta: Record<TaskType, { label: string; icon: CrmIcon }> = {
  call: { label: 'Llamada', icon: PhoneCall },
  whatsapp: { label: 'WhatsApp', icon: MessageCircle },
  email: { label: 'Correo', icon: Mail },
  visit: { label: 'Visita', icon: Users },
  other: { label: 'Otra', icon: ClipboardList },
};

export const taskPriorityMeta: Record<
  TaskPriority,
  { label: string; badgeClass: string; dotClass: string }
> = {
  low: {
    label: 'Baja',
    badgeClass: 'border-transparent bg-muted text-muted-foreground',
    dotClass: 'bg-muted-foreground/50',
  },
  medium: {
    label: 'Media',
    badgeClass: 'border-transparent bg-sky-500/15 text-sky-600 dark:text-sky-400',
    dotClass: 'bg-sky-500',
  },
  high: {
    label: 'Alta',
    badgeClass: 'border-transparent bg-rose-500/15 text-rose-600 dark:text-rose-400',
    dotClass: 'bg-rose-500',
  },
};

/** ¿La tarea está vencida y pendiente? */
export function isTaskOverdue(task: Pick<FollowUpTask, 'dueAt' | 'status'>): boolean {
  return task.status === 'pending' && new Date(task.dueAt).getTime() < Date.now();
}

/* --------------------------------- Oportunidades --------------------------- */

export const dealStageMeta: Record<
  DealStage,
  { label: string; badgeClass: string; barClass: string }
> = {
  new: {
    label: 'Nueva',
    badgeClass: 'border-transparent bg-sky-500/15 text-sky-600 dark:text-sky-400',
    barClass: 'bg-sky-500',
  },
  contacted: {
    label: 'Contactada',
    badgeClass: 'border-transparent bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
    barClass: 'bg-indigo-500',
  },
  quoted: {
    label: 'Cotización enviada',
    badgeClass: 'border-transparent bg-amber-500/15 text-amber-600 dark:text-amber-400',
    barClass: 'bg-amber-500',
  },
  negotiation: {
    label: 'Negociación',
    badgeClass: 'border-transparent bg-violet-500/15 text-violet-600 dark:text-violet-400',
    barClass: 'bg-violet-500',
  },
  won: {
    label: 'Ganada',
    badgeClass: 'border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    barClass: 'bg-emerald-500',
  },
  lost: {
    label: 'Perdida',
    badgeClass: 'border-transparent bg-rose-500/15 text-rose-600 dark:text-rose-400',
    barClass: 'bg-rose-500',
  },
};

export const dealStageOrder: readonly DealStage[] = [
  'new',
  'contacted',
  'quoted',
  'negotiation',
  'won',
  'lost',
];

/** Etapas abiertas del pipeline (excluye ganadas y perdidas). */
export const openDealStages: readonly DealStage[] = ['new', 'contacted', 'quoted', 'negotiation'];

/* ----------------------------------- Citas --------------------------------- */

export const appointmentStatusMeta: Record<
  AppointmentStatus,
  { label: string; badgeClass: string }
> = {
  scheduled: {
    label: 'Agendada',
    badgeClass: 'border-transparent bg-sky-500/15 text-sky-600 dark:text-sky-400',
  },
  confirmed: {
    label: 'Confirmada',
    badgeClass: 'border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  },
  completed: {
    label: 'Completada',
    badgeClass: 'border-transparent bg-primary/15 text-primary',
  },
  cancelled: {
    label: 'Cancelada',
    badgeClass: 'border-transparent bg-rose-500/15 text-rose-600 dark:text-rose-400',
  },
};

/* ---------------------------------- Iconos -------------------------------- */

export const crmIcons = {
  user: UserRound,
  users: Users,
  mail: Mail,
  at: AtSign,
  phone: Phone,
  cake: Cake,
  tag: Tag,
  deal: CircleDollarSign,
  sparkles: Sparkles,
  heart: HeartPulse,
  video: Video,
  gift: Gift,
  clock: Clock,
} as const;
