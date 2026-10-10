/**
 * Tipos de MediPlan alineados con la documentación OpenAPI de la API
 * (`https://mediplan-api.appsline.com.mx/docs?api-docs.json`).
 *
 * Convención: los campos `name` de roles, estados y citas son valores estables
 * en inglés (para lógica); `label` es el texto en español para mostrar.
 */

/* ------------------------------ Envolventes ------------------------------ */

export interface MessageResponse {
  message: string;
}

export interface ItemResponse<T> {
  message: string;
  data: T;
}

export interface PaginationMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
}

export interface PaginatedResponse<T> {
  message: string;
  data: T[];
  meta: PaginationMeta;
}

/* --------------------------------- Básicos ------------------------------- */

export type RoleName = 'client' | 'business' | 'admin';

export interface Role {
  name: RoleName;
  label: string;
}

export interface Status {
  name: string;
  label: string;
}

export interface RoleCatalogItem {
  id: number;
  name: RoleName;
  label: string;
  description?: string | null;
  users_count?: number | null;
}

/* --------------------------------- Usuario ------------------------------- */

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  email_verified_at: string | null;
  is_active: boolean;
  business?: Business | null;
  roles: Role[];
  created_at: string | null;
}

export interface AuthPayload {
  user: User;
  token: string;
  token_type: 'Bearer';
}

export interface AuthResponse {
  message: string;
  data: AuthPayload;
}

export type MeResponse = ItemResponse<{ user: User }>;

/* -------------------------------- Negocio -------------------------------- */

export interface Business {
  id: number;
  name: string;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  status: Status;
  owner?: User | null;
  clients_count?: number | null;
  leads_count?: number | null;
  appointments_count?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export type BusinessStatusName = 'pending' | 'active' | 'suspended';

export type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface WorkingDay {
  open: string;
  close: string;
  closed: boolean;
}

export interface BusinessSettings {
  id?: number;
  business_id?: number;
  timezone: string;
  appointment_duration_minutes: number;
  slot_interval_minutes?: number;
  min_notice_minutes?: number;
  max_advance_days?: number;
  working_hours: Partial<Record<DayKey, WorkingDay>>;
  auto_confirm_appointments?: boolean;
  allow_online_booking?: boolean;
  currency?: string;
  updated_at?: string | null;
}

/* -------------------------------- Clientes ------------------------------- */

export type ClientStatusName = 'active' | 'inactive';

export interface Client {
  id: number;
  business_id: number;
  name: string;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  notes: string | null;
  status: Status;
  user?: User | null;
  business?: Business | null;
  appointments_count?: number | null;
  last_appointment_at?: string | null;
  created_at: string | null;
  updated_at?: string | null;
}

/* --------------------------------- Leads --------------------------------- */

export type LeadStatusName = 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';

export interface LeadStatus extends Status {
  is_open?: boolean;
}

export interface Lead {
  id: number;
  business_id: number;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string | null;
  status: LeadStatus;
  estimated_value: number | null;
  notes: string | null;
  assigned_to?: User | null;
  follow_up_at: string | null;
  contacted_at: string | null;
  converted_client?: Client | null;
  converted_at: string | null;
  created_at: string | null;
  updated_at?: string | null;
}

/* ------------------------------- Citas ----------------------------------- */

export type AppointmentStatusName = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export interface AppointmentStatus extends Status {
  is_booked?: boolean;
}

export interface Appointment {
  id: number;
  business_id: number;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  status: AppointmentStatus;
  price: number | null;
  client?: Client | null;
  business?: Business | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  created_at: string | null;
  updated_at?: string | null;
}

export interface AgendaDay {
  date: string;
  label: string;
  total: number;
  appointments: Appointment[];
}

export interface AgendaData {
  from: string;
  to: string;
  total: number;
  days: AgendaDay[];
}

export type AgendaResponse = ItemResponse<AgendaData>;

/* ------------------------------ Dashboards ------------------------------- */

export interface MonthlyActivity {
  month: string;
  label: string;
  total: number;
  completed: number;
  cancelled: number;
}

export interface BusinessDashboardData {
  business: { id: number; name: string; status: Status };
  clients: { total: number; active: number; new_this_month: number };
  leads: {
    total: number;
    open: number;
    by_status: Partial<Record<LeadStatusName, number>>;
    conversion_rate: number;
  };
  appointments: {
    today: number;
    next_week: number;
    completed_this_month: number;
    cancelled_this_month: number;
    revenue_this_month: number;
    monthly_activity: MonthlyActivity[];
  };
  next_appointments: Appointment[];
  recent_leads: Lead[];
  recent_clients: Client[];
}

export interface ClientDashboardData {
  user: { id: number; name: string };
  appointments: {
    upcoming_count: number;
    completed: number;
    cancelled: number;
    total: number;
    next: Appointment | null;
  };
  upcoming_appointments: Appointment[];
  businesses: { registered_in: number; available: number };
}

export interface AdminDashboardData {
  users: {
    total: number;
    inactive: number;
    new_last_month: number;
    by_role: Array<{ name: RoleName; label: string; total: number }>;
  };
  businesses: {
    total: number;
    new_last_month: number;
    by_status: Array<{ name: BusinessStatusName; label: string; total: number }>;
  };
  clients: { total: number; new_last_month: number };
  leads: { total: number; open: number; won: number; conversion_rate: number };
  appointments: { total: number; today: number; upcoming: number; completed: number };
  recent_users: User[];
  recent_businesses: Business[];
}

/* ----------------------------- Payloads (body) --------------------------- */

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role: 'cliente' | 'negocio';
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface BusinessProfilePayload {
  name?: string;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
}

export interface BusinessSettingsPayload {
  timezone?: string;
  appointment_duration_minutes?: number;
  slot_interval_minutes?: number;
  min_notice_minutes?: number;
  max_advance_days?: number;
  auto_confirm_appointments?: boolean;
  allow_online_booking?: boolean;
  currency?: string;
  working_hours?: Partial<Record<DayKey, WorkingDay>>;
}

export interface ClientPayload {
  name: string;
  email?: string | null;
  phone?: string | null;
  birth_date?: string | null;
  notes?: string | null;
  status?: ClientStatusName;
  user_id?: number | null;
}

export interface LeadPayload {
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  source?: string | null;
  status?: LeadStatusName;
  estimated_value?: number | null;
  notes?: string | null;
  assigned_to_user_id?: number | null;
  follow_up_at?: string | null;
}

export interface LeadStatusPayload {
  status: LeadStatusName;
  notes?: string | null;
  follow_up_at?: string | null;
}

export interface ConvertLeadPayload {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
}

export interface AppointmentPayload {
  client_id: number;
  title: string;
  description?: string | null;
  starts_at: string;
  ends_at: string;
  status?: 'scheduled' | 'confirmed';
  price?: number | null;
}

export interface AppointmentStatusPayload {
  status: 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  cancel_reason?: string | null;
}

export interface AdminUserPayload {
  name?: string;
  email?: string;
  phone?: string | null;
  password?: string;
  password_confirmation?: string;
  role?: string;
  business_name?: string | null;
  is_active?: boolean;
}

export interface AdminBusinessPayload extends BusinessProfilePayload {
  name?: string;
}

/* ------------------------------- Listados -------------------------------- */

export type ListQuery = Record<string, string | number | boolean | null | undefined>;
