/**
 * Tipos compartidos de MediPlan.
 *
 * Esta fase implementa únicamente el modelo de autenticación; el resto de
 * entidades quedan preparadas para las fases de dashboard, agenda y
 * seguimiento de pacientes.
 */

export type ProfessionalType = 'dentist' | 'doctor' | 'nurse' | 'esthetician' | 'other';

export interface User {
  id: string;
  name: string;
  email: string;
  professionalType: ProfessionalType;
  clinicName?: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  name: string;
  professionalType: ProfessionalType;
  clinicName?: string;
}

// Preparados para fases futuras
export interface Appointment {
  id: string;
  patientName: string;
  professionalId: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  lastVisit?: string;
  tags: string[];
}

export interface Clinic {
  id: string;
  name: string;
  ownerId: string;
  specialties: ProfessionalType[];
  createdAt: string;
}
