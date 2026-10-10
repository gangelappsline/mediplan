import type {
  ActivityEvent,
  AppointmentStatus,
  Client,
  ClientSource,
  ClientStatus,
  CrmAppointment,
  CrmData,
  Deal,
  DealStage,
  FollowUpTask,
  TaskPriority,
  TaskType,
} from '@/features/crm/types';

/**
 * Datos de demostración del CRM. Se generan con fechas relativas al momento de
 * la siembra para que las pantallas (agenda, seguimientos, reportes) siempre
 * se vean vivas.
 */

function at(dayOffset: number, hour = 10, minute = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function ymd(dayOffset: number): string {
  return at(dayOffset, 12).slice(0, 10);
}

function monthsAgo(months: number, day = 12): string {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  date.setDate(day);
  date.setHours(11, 30, 0, 0);
  return date.toISOString();
}

interface ClientSeed {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: ClientStatus;
  source: ClientSource;
  tags: string[];
  months: number;
  company?: string;
  birthDate?: string;
  notes?: string;
  lastContactDays?: number;
}

const clientSeeds: readonly ClientSeed[] = [
  {
    id: 'cli-1',
    name: 'Ana Gabriela Torres',
    email: 'ana.torres@correo.com',
    phone: '+52 55 1234 5678',
    status: 'vip',
    source: 'referido',
    tags: ['Frecuente', 'Estética'],
    months: 7,
    birthDate: '1988-04-12',
    notes: 'Prefiere citas por la tarde. Sensibilidad dental al blanqueamiento.',
    lastContactDays: 5,
  },
  {
    id: 'cli-2',
    name: 'Carlos Mendoza',
    email: 'carlos.mendoza@correo.com',
    phone: '+52 55 2345 6789',
    status: 'active',
    source: 'whatsapp',
    tags: ['Ortodoncia'],
    months: 6,
    birthDate: '1995-09-30',
    notes: 'Tratamiento de ortodoncia en curso — revisión cada mes.',
    lastContactDays: 2,
  },
  {
    id: 'cli-3',
    name: 'María López',
    email: 'maria.lopez@correo.com',
    phone: '+52 55 3456 7890',
    status: 'active',
    source: 'instagram',
    tags: ['Limpieza', 'Potencial'],
    months: 6,
    birthDate: '1992-01-18',
    lastContactDays: 8,
  },
  {
    id: 'cli-4',
    name: 'Jorge Ramírez',
    email: 'jorge.ramirez@correo.com',
    phone: '+52 55 4567 8901',
    status: 'lead',
    source: 'web',
    tags: ['Potencial'],
    months: 0,
    notes: 'Solicitó cotización de implantes desde el sitio web.',
    lastContactDays: 1,
  },
  {
    id: 'cli-5',
    name: 'Sofía Hernández',
    email: 'sofia.hernandez@correo.com',
    phone: '+52 55 5678 9012',
    status: 'active',
    source: 'referido',
    tags: ['Ortodoncia', 'Frecuente'],
    months: 5,
    birthDate: '2001-06-22',
    lastContactDays: 4,
  },
  {
    id: 'cli-6',
    name: 'Luis Alberto Torres',
    email: 'luis.torres@correo.com',
    phone: '+52 55 6789 0123',
    status: 'inactive',
    source: 'llamada',
    tags: [],
    months: 4,
    notes: 'Se mudó de ciudad. Retomar contacto en temporada de fiestas.',
    lastContactDays: 40,
  },
  {
    id: 'cli-7',
    name: 'Valeria Cruz',
    email: 'valeria.cruz@correo.com',
    phone: '+52 55 7890 1234',
    status: 'vip',
    source: 'instagram',
    tags: ['Estética', 'Empresarial'],
    months: 3,
    company: 'Estudio Cruz',
    birthDate: '1986-11-05',
    notes: 'Interesada en convenio empresarial para su equipo.',
    lastContactDays: 7,
  },
  {
    id: 'cli-8',
    name: 'Miguel Ángel Ruiz',
    email: 'miguel.ruiz@correo.com',
    phone: '+52 55 8901 2345',
    status: 'active',
    source: 'whatsapp',
    tags: ['Limpieza'],
    months: 2,
    birthDate: '1979-03-14',
    lastContactDays: 6,
  },
  {
    id: 'cli-9',
    name: 'Fernanda Ortiz',
    email: 'fernanda.ortiz@correo.com',
    phone: '+52 55 9012 3456',
    status: 'lead',
    source: 'facebook',
    tags: ['Potencial', 'Urgente'],
    months: 0,
    notes: 'Reporta dolor molar. Quiere cita lo antes posible.',
    lastContactDays: 1,
  },
  {
    id: 'cli-10',
    name: 'Ricardo Salas',
    email: 'ricardo.salas@correo.com',
    phone: '+52 55 0123 4567',
    status: 'active',
    source: 'referido',
    tags: ['Empresarial', 'Frecuente'],
    months: 5,
    company: 'Salas & Asociados',
    birthDate: '1983-08-27',
    lastContactDays: 2,
  },
  {
    id: 'cli-11',
    name: 'Daniela Vega',
    email: 'daniela.vega@correo.com',
    phone: '+52 55 1122 3344',
    status: 'active',
    source: 'whatsapp',
    tags: ['Estética'],
    months: 1,
    birthDate: '1998-12-02',
    lastContactDays: 3,
  },
  {
    id: 'cli-12',
    name: 'Pedro Morales',
    email: 'pedro.morales@correo.com',
    phone: '+52 55 2233 4455',
    status: 'inactive',
    source: 'web',
    tags: [],
    months: 4,
    notes: 'Cotización de carillas sin respuesta.',
    lastContactDays: 22,
  },
  {
    id: 'cli-13',
    name: 'Gabriela Ríos',
    email: 'gabriela.rios@correo.com',
    phone: '+52 55 3344 5566',
    status: 'lead',
    source: 'instagram',
    tags: ['Potencial'],
    months: 0,
    notes: 'Preguntó precios de ortodoncia invisible por Instagram.',
    lastContactDays: 2,
  },
  {
    id: 'cli-14',
    name: 'Andrés Navarro',
    email: 'andres.navarro@correo.com',
    phone: '+52 55 4455 6677',
    status: 'active',
    source: 'whatsapp',
    tags: ['Ortodoncia', 'Referido'],
    months: 2,
    birthDate: '1990-07-19',
    lastContactDays: 5,
  },
];

interface ActivitySeed {
  clientId: string;
  kind: ActivityEvent['kind'];
  title: string;
  description: string;
  dayOffset: number;
  hour: number;
}

const activitySeeds: readonly ActivitySeed[] = [
  {
    clientId: 'cli-1',
    kind: 'visit',
    title: 'Limpieza profunda',
    description: 'Sesión de limpieza completada. Buena evolución general.',
    dayOffset: -10,
    hour: 12,
  },
  {
    clientId: 'cli-1',
    kind: 'call',
    title: 'Llamada de seguimiento',
    description: 'Confirmó interés en blanqueamiento para diciembre.',
    dayOffset: -5,
    hour: 17,
  },
  {
    clientId: 'cli-1',
    kind: 'system',
    title: 'Cliente marcado como VIP',
    description: 'Superó los 10 tratamientos en el año.',
    dayOffset: -60,
    hour: 9,
  },
  {
    clientId: 'cli-2',
    kind: 'whatsapp',
    title: 'Recordatorio de cita enviado',
    description: 'Plantilla de recordatorio entregada correctamente.',
    dayOffset: -2,
    hour: 11,
  },
  {
    clientId: 'cli-2',
    kind: 'note',
    title: 'Ajuste de brackets',
    description: 'Se realizó el ajuste mensual. Próximo control en 4 semanas.',
    dayOffset: -30,
    hour: 16,
  },
  {
    clientId: 'cli-3',
    kind: 'note',
    title: 'Consulta inicial',
    description: 'Interesada en un plan de limpieza trimestral.',
    dayOffset: -12,
    hour: 10,
  },
  {
    clientId: 'cli-3',
    kind: 'call',
    title: 'Seguimiento de limpieza',
    description: 'Agendó su próxima limpieza para dentro de 3 meses.',
    dayOffset: -8,
    hour: 11,
  },
  {
    clientId: 'cli-4',
    kind: 'call',
    title: 'Primer contacto',
    description: 'Respondió al formulario web. Enviar presupuesto de implantes.',
    dayOffset: -1,
    hour: 15,
  },
  {
    clientId: 'cli-5',
    kind: 'whatsapp',
    title: 'Cambio de horario',
    description: 'Movió su cita del martes al jueves.',
    dayOffset: -4,
    hour: 9,
  },
  {
    clientId: 'cli-5',
    kind: 'visit',
    title: 'Control de ortodoncia',
    description: 'Control mensual sin novedades.',
    dayOffset: -18,
    hour: 12,
  },
  {
    clientId: 'cli-6',
    kind: 'note',
    title: 'Sin respuesta',
    description: 'Dos intentos de contacto sin éxito.',
    dayOffset: -40,
    hour: 10,
  },
  {
    clientId: 'cli-7',
    kind: 'email',
    title: 'Propuesta empresarial',
    description: 'Enviada propuesta de convenio para empleados de Estudio Cruz.',
    dayOffset: -7,
    hour: 13,
  },
  {
    clientId: 'cli-7',
    kind: 'visit',
    title: 'Visita a la clínica',
    description: 'Recorrido por instalaciones. Muy interesada en el convenio.',
    dayOffset: -20,
    hour: 11,
  },
  {
    clientId: 'cli-8',
    kind: 'whatsapp',
    title: 'Encuesta post-consulta',
    description: 'Respondió la encuesta con calificación de 5/5.',
    dayOffset: -6,
    hour: 18,
  },
  {
    clientId: 'cli-9',
    kind: 'note',
    title: 'Reporta dolor molar',
    description: 'Quiere cita urgente esta semana.',
    dayOffset: -1,
    hour: 19,
  },
  {
    clientId: 'cli-10',
    kind: 'call',
    title: 'Renovación de convenio',
    description: 'Interesado en ampliar el paquete para su equipo.',
    dayOffset: -8,
    hour: 16,
  },
  {
    clientId: 'cli-10',
    kind: 'whatsapp',
    title: 'Confirmación de cita',
    description: 'Confirmó asistencia para el viernes.',
    dayOffset: -2,
    hour: 8,
  },
  {
    clientId: 'cli-11',
    kind: 'whatsapp',
    title: 'Promoción enviada',
    description: 'Promoción de blanqueamiento con 20% de descuento.',
    dayOffset: -3,
    hour: 12,
  },
  {
    clientId: 'cli-12',
    kind: 'email',
    title: 'Newsletter enviado',
    description: 'Promoción de fin de mes. Sin respuesta por ahora.',
    dayOffset: -15,
    hour: 9,
  },
  {
    clientId: 'cli-13',
    kind: 'note',
    title: 'Comentario en publicación',
    description: 'Preguntó por precios de ortodoncia invisible.',
    dayOffset: -2,
    hour: 14,
  },
  {
    clientId: 'cli-14',
    kind: 'system',
    title: 'Cliente creado desde WhatsApp',
    description: 'Alta automática por mensaje entrante.',
    dayOffset: -55,
    hour: 10,
  },
];

interface TaskSeed {
  clientId: string;
  title: string;
  type: TaskType;
  priority: TaskPriority;
  dueDayOffset: number;
  dueHour: number;
  done?: boolean;
}

const taskSeeds: readonly TaskSeed[] = [
  {
    clientId: 'cli-4',
    title: 'Enviar cotización de implantes',
    type: 'email',
    priority: 'high',
    dueDayOffset: -1,
    dueHour: 12,
  },
  {
    clientId: 'cli-6',
    title: 'Llamada de reactivación',
    type: 'call',
    priority: 'medium',
    dueDayOffset: -2,
    dueHour: 15,
  },
  {
    clientId: 'cli-9',
    title: 'Llamar para agendar cita urgente',
    type: 'call',
    priority: 'high',
    dueDayOffset: 0,
    dueHour: 9,
  },
  {
    clientId: 'cli-13',
    title: 'Responder duda sobre ortodoncia',
    type: 'whatsapp',
    priority: 'medium',
    dueDayOffset: 0,
    dueHour: 16,
  },
  {
    clientId: 'cli-14',
    title: 'Enviar plan de financiamiento',
    type: 'email',
    priority: 'medium',
    dueDayOffset: 1,
    dueHour: 11,
  },
  {
    clientId: 'cli-1',
    title: 'Confirmar blanqueamiento para diciembre',
    type: 'call',
    priority: 'medium',
    dueDayOffset: 2,
    dueHour: 11,
  },
  {
    clientId: 'cli-7',
    title: 'Dar seguimiento a propuesta empresarial',
    type: 'email',
    priority: 'high',
    dueDayOffset: 3,
    dueHour: 10,
  },
  {
    clientId: 'cli-2',
    title: 'Recordar control mensual de ortodoncia',
    type: 'whatsapp',
    priority: 'low',
    dueDayOffset: 5,
    dueHour: 10,
  },
  {
    clientId: 'cli-11',
    title: 'Consultar interés en la promoción',
    type: 'whatsapp',
    priority: 'low',
    dueDayOffset: 6,
    dueHour: 12,
  },
  {
    clientId: 'cli-10',
    title: 'Preparar renovación de convenio',
    type: 'other',
    priority: 'medium',
    dueDayOffset: 8,
    dueHour: 9,
  },
  {
    clientId: 'cli-5',
    title: 'Coordinar próxima cita de control',
    type: 'call',
    priority: 'low',
    dueDayOffset: 12,
    dueHour: 11,
  },
  {
    clientId: 'cli-3',
    title: 'Confirmar limpieza trimestral',
    type: 'call',
    priority: 'medium',
    dueDayOffset: -3,
    dueHour: 10,
    done: true,
  },
  {
    clientId: 'cli-8',
    title: 'Enviar encuesta de satisfacción',
    type: 'whatsapp',
    priority: 'low',
    dueDayOffset: -6,
    dueHour: 10,
    done: true,
  },
  {
    clientId: 'cli-12',
    title: 'Reactivar contacto',
    type: 'email',
    priority: 'medium',
    dueDayOffset: -12,
    dueHour: 10,
    done: true,
  },
];

interface DealSeed {
  clientId: string;
  title: string;
  value: number;
  stage: DealStage;
  probability: number;
  closeDayOffset: number;
  notes?: string;
}

const dealSeeds: readonly DealSeed[] = [
  {
    clientId: 'cli-4',
    title: 'Implantes dentales (2 piezas)',
    value: 4800,
    stage: 'quoted',
    probability: 60,
    closeDayOffset: 15,
    notes: 'Presupuesto enviado. Decisión esperada este mes.',
  },
  {
    clientId: 'cli-9',
    title: 'Tratamiento de urgencia',
    value: 650,
    stage: 'new',
    probability: 30,
    closeDayOffset: 5,
  },
  {
    clientId: 'cli-13',
    title: 'Ortodoncia invisible',
    value: 3200,
    stage: 'contacted',
    probability: 40,
    closeDayOffset: 30,
  },
  {
    clientId: 'cli-7',
    title: 'Convenio empresarial (10 personas)',
    value: 12500,
    stage: 'negotiation',
    probability: 70,
    closeDayOffset: 20,
    notes: 'Pidió descuento por volumen. Revisar con dirección.',
  },
  {
    clientId: 'cli-1',
    title: 'Blanqueamiento + limpieza',
    value: 900,
    stage: 'quoted',
    probability: 80,
    closeDayOffset: 25,
  },
  {
    clientId: 'cli-10',
    title: 'Renovación de convenio anual',
    value: 8400,
    stage: 'negotiation',
    probability: 75,
    closeDayOffset: 12,
  },
  {
    clientId: 'cli-3',
    title: 'Plan de limpieza trimestral',
    value: 720,
    stage: 'contacted',
    probability: 50,
    closeDayOffset: 18,
  },
  {
    clientId: 'cli-2',
    title: 'Retenedores post-ortodoncia',
    value: 450,
    stage: 'new',
    probability: 35,
    closeDayOffset: 40,
  },
  {
    clientId: 'cli-8',
    title: 'Plan familiar anual',
    value: 1900,
    stage: 'contacted',
    probability: 45,
    closeDayOffset: 22,
  },
  {
    clientId: 'cli-5',
    title: 'Blanqueamiento',
    value: 550,
    stage: 'won',
    probability: 100,
    closeDayOffset: -6,
    notes: 'Cerrado con pago único.',
  },
  {
    clientId: 'cli-11',
    title: 'Promoción de blanqueamiento',
    value: 480,
    stage: 'won',
    probability: 100,
    closeDayOffset: -2,
  },
  {
    clientId: 'cli-12',
    title: 'Carillas estéticas',
    value: 2600,
    stage: 'lost',
    probability: 0,
    closeDayOffset: -20,
    notes: 'Se fue con otro proveedor por precio.',
  },
];

interface AppointmentSeed {
  clientId: string;
  title: string;
  dayOffset: number;
  startHour: number;
  durationMinutes: number;
  status: AppointmentStatus;
  notes?: string;
}

const appointmentSeeds: readonly AppointmentSeed[] = [
  {
    clientId: 'cli-9',
    title: 'Consulta de urgencia',
    dayOffset: 1,
    startHour: 9,
    durationMinutes: 30,
    status: 'scheduled',
  },
  {
    clientId: 'cli-2',
    title: 'Control de ortodoncia',
    dayOffset: 1,
    startHour: 11,
    durationMinutes: 45,
    status: 'confirmed',
    notes: 'Traer tarjeta de control.',
  },
  {
    clientId: 'cli-14',
    title: 'Colocación de retenedores',
    dayOffset: 2,
    startHour: 13,
    durationMinutes: 60,
    status: 'scheduled',
  },
  {
    clientId: 'cli-1',
    title: 'Limpieza dental',
    dayOffset: 3,
    startHour: 16,
    durationMinutes: 60,
    status: 'scheduled',
  },
  {
    clientId: 'cli-5',
    title: 'Control mensual',
    dayOffset: 4,
    startHour: 12,
    durationMinutes: 30,
    status: 'confirmed',
  },
  {
    clientId: 'cli-10',
    title: 'Evaluación de convenio',
    dayOffset: 6,
    startHour: 10,
    durationMinutes: 60,
    status: 'scheduled',
    notes: 'Asistirá con su gerente de RH.',
  },
  {
    clientId: 'cli-3',
    title: 'Limpieza trimestral',
    dayOffset: 8,
    startHour: 11,
    durationMinutes: 45,
    status: 'scheduled',
  },
  {
    clientId: 'cli-7',
    title: 'Visita de seguimiento',
    dayOffset: 10,
    startHour: 15,
    durationMinutes: 45,
    status: 'scheduled',
  },
  {
    clientId: 'cli-8',
    title: 'Revisión general',
    dayOffset: -7,
    startHour: 10,
    durationMinutes: 60,
    status: 'completed',
    notes: 'Todo en orden. Próxima revisión en 6 meses.',
  },
  {
    clientId: 'cli-11',
    title: 'Blanqueamiento (promoción)',
    dayOffset: -3,
    startHour: 17,
    durationMinutes: 60,
    status: 'completed',
  },
  {
    clientId: 'cli-6',
    title: 'Consulta inicial',
    dayOffset: -25,
    startHour: 12,
    durationMinutes: 60,
    status: 'cancelled',
    notes: 'Canceló por viaje.',
  },
];

/** Genera un conjunto completo de datos CRM de demostración. */
export function seedCrmData(): CrmData {
  const clients: Client[] = clientSeeds.map((seed) => ({
    id: seed.id,
    name: seed.name,
    email: seed.email,
    phone: seed.phone,
    status: seed.status,
    source: seed.source,
    tags: seed.tags,
    company: seed.company,
    birthDate: seed.birthDate,
    notes: seed.notes,
    createdAt: monthsAgo(seed.months),
    updatedAt: monthsAgo(Math.max(0, seed.months - 1)),
    lastContactAt: seed.lastContactDays !== undefined ? at(-seed.lastContactDays, 12) : undefined,
  }));

  const activities: ActivityEvent[] = activitySeeds.map((seed, index) => ({
    id: `act-${index + 1}`,
    clientId: seed.clientId,
    kind: seed.kind,
    title: seed.title,
    description: seed.description,
    createdAt: at(seed.dayOffset, seed.hour),
    author: 'Equipo clínica',
  }));

  const tasks: FollowUpTask[] = taskSeeds.map((seed, index) => ({
    id: `tsk-${index + 1}`,
    clientId: seed.clientId,
    title: seed.title,
    type: seed.type,
    status: seed.done ? 'done' : 'pending',
    priority: seed.priority,
    dueAt: at(seed.dueDayOffset, seed.dueHour),
    createdAt: at(seed.dueDayOffset - 7, 10),
    completedAt: seed.done ? at(seed.dueDayOffset, seed.dueHour + 1) : undefined,
  }));

  const deals: Deal[] = dealSeeds.map((seed, index) => ({
    id: `deal-${index + 1}`,
    clientId: seed.clientId,
    title: seed.title,
    value: seed.value,
    stage: seed.stage,
    probability: seed.probability,
    expectedCloseAt: ymd(seed.closeDayOffset),
    notes: seed.notes,
    createdAt: at(Math.min(-2, seed.closeDayOffset - 20), 11),
    updatedAt: at(Math.min(-1, seed.closeDayOffset - 5), 11),
  }));

  const appointments: CrmAppointment[] = appointmentSeeds.map((seed, index) => ({
    id: `apt-${index + 1}`,
    clientId: seed.clientId,
    title: seed.title,
    startsAt: at(seed.dayOffset, seed.startHour),
    endsAt: at(seed.dayOffset, seed.startHour, 0) /* recalculado abajo */,
    status: seed.status,
    notes: seed.notes,
    createdAt: at(Math.min(-1, seed.dayOffset - 10), 10),
  }));

  // Recalcula los fines de cita con la duración real de cada semilla.
  appointmentSeeds.forEach((seed, index) => {
    const start = new Date(at(seed.dayOffset, seed.startHour));
    start.setMinutes(start.getMinutes() + seed.durationMinutes);
    appointments[index].endsAt = start.toISOString();
  });

  return { clients, activities, tasks, deals, appointments };
}
