/**
 * Tipos del módulo CRM de MediPlan: clientes, interacciones, seguimientos,
 * oportunidades (pipeline) y citas.
 *
 * Todos los timestamps se guardan como ISO 8601 (`Date.toISOString()`).
 */

export type ClientStatus = 'lead' | 'active' | 'inactive' | 'vip';

export type ClientSource =
  | 'whatsapp'
  | 'instagram'
  | 'facebook'
  | 'referido'
  | 'web'
  | 'llamada'
  | 'otro';

export type ActivityKind = 'note' | 'call' | 'whatsapp' | 'email' | 'visit' | 'system';

export type TaskType = 'call' | 'whatsapp' | 'email' | 'visit' | 'other';

export type TaskStatus = 'pending' | 'done';

export type TaskPriority = 'low' | 'medium' | 'high';

export type DealStage = 'new' | 'contacted' | 'quoted' | 'negotiation' | 'won' | 'lost';

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: ClientStatus;
  source: ClientSource;
  tags: string[];
  company?: string;
  /** Fecha de nacimiento `YYYY-MM-DD`. */
  birthDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  /** Última interacción registrada (llamada, WhatsApp, visita…). */
  lastContactAt?: string;
}

export interface ActivityEvent {
  id: string;
  clientId: string;
  kind: ActivityKind;
  title: string;
  description?: string;
  createdAt: string;
  author: string;
}

export interface FollowUpTask {
  id: string;
  clientId: string;
  title: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  /** Fecha límite del seguimiento (ISO). */
  dueAt: string;
  notes?: string;
  createdAt: string;
  completedAt?: string;
}

export interface Deal {
  id: string;
  clientId: string;
  title: string;
  value: number;
  stage: DealStage;
  /** Probabilidad de cierre (0-100). */
  probability: number;
  /** Cierre esperado `YYYY-MM-DD`. */
  expectedCloseAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CrmAppointment {
  id: string;
  clientId: string;
  title: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
}

export interface CrmData {
  clients: Client[];
  activities: ActivityEvent[];
  tasks: FollowUpTask[];
  deals: Deal[];
  appointments: CrmAppointment[];
}

/* ---------------------------------- Inputs --------------------------------- */

export interface ClientInput {
  name: string;
  email: string;
  phone: string;
  status: ClientStatus;
  source: ClientSource;
  tags: string[];
  company: string;
  /** `YYYY-MM-DD` o cadena vacía. */
  birthDate: string;
  notes: string;
}

export interface TaskInput {
  clientId: string;
  title: string;
  type: TaskType;
  priority: TaskPriority;
  /** Fecha límite en formato `datetime-local` (`YYYY-MM-DDTHH:mm`). */
  dueAt: string;
  notes: string;
}

export interface DealInput {
  clientId: string;
  title: string;
  value: number;
  stage: DealStage;
  probability: number;
  /** `YYYY-MM-DD` o cadena vacía. */
  expectedCloseAt: string;
  notes: string;
}

export interface AppointmentInput {
  clientId: string;
  title: string;
  /** Inicio en formato `datetime-local` (`YYYY-MM-DDTHH:mm`). */
  startsAt: string;
  /** Fin en formato `datetime-local` (`YYYY-MM-DDTHH:mm`). */
  endsAt: string;
  status: AppointmentStatus;
  notes: string;
}

export interface ActivityInput {
  clientId: string;
  kind: ActivityKind;
  title: string;
  description: string;
}
