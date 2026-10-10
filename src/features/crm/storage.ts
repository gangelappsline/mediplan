import { seedCrmData } from '@/features/crm/seed';
import type {
  ActivityInput,
  AppointmentInput,
  AppointmentStatus,
  Client,
  ClientInput,
  CrmAppointment,
  CrmData,
  Deal,
  DealInput,
  DealStage,
  FollowUpTask,
  TaskInput,
} from '@/features/crm/types';

/**
 * Almacén del CRM sobre `localStorage`, agrupado por clínica (mismo patrón que
 * `features/whatsapp/storage.ts`): lectura con snapshot estable para
 * `useSyncExternalStore` y notificación a suscriptores en cada mutación.
 *
 * La primera lectura de una clínica siembra datos de demostración para que el
 * panel funcione como un CRM real desde el primer inicio.
 */

const STORAGE_KEY = 'mediplan-crm';

type CrmStore = Record<string, CrmData>;

const listeners = new Set<() => void>();
let snapshotCache: { clinicId: string; raw: string; value: CrmData } | null = null;

function emptyStore(): CrmStore {
  return {};
}

function readStore(): CrmStore {
  if (typeof window === 'undefined') return emptyStore();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as CrmStore;
    return parsed && typeof parsed === 'object' ? parsed : emptyStore();
  } catch {
    return emptyStore();
  }
}

function persistStore(store: CrmStore, notify: boolean): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  snapshotCache = null;
  if (notify) {
    for (const listener of listeners) listener();
  }
}

function snapshotOf(clinicId: string, data: CrmData): CrmData {
  const raw = JSON.stringify(data);
  if (snapshotCache && snapshotCache.clinicId === clinicId && snapshotCache.raw === raw) {
    return snapshotCache.value;
  }
  snapshotCache = { clinicId, raw, value: data };
  return data;
}

/** Suscribe un listener a los cambios del CRM. */
export function subscribeCrm(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Lee los datos CRM de la clínica. Si es la primera vez, siembra datos de
 * demostración (persistidos sin notificar para no re-renderizar durante la
 * lectura).
 */
export function readCrmData(clinicId: string): CrmData {
  const store = readStore();
  const existing = store[clinicId];
  if (existing) {
    return snapshotOf(clinicId, existing);
  }

  const seeded = seedCrmData();
  store[clinicId] = seeded;
  persistStore(store, false);
  return snapshotOf(clinicId, seeded);
}

/** Vacía y vuelve a sembrar los datos de demostración de la clínica. */
export function resetCrmData(clinicId: string): void {
  const store = readStore();
  store[clinicId] = seedCrmData();
  persistStore(store, true);
}

function mutate<T>(clinicId: string, recipe: (data: CrmData) => T): T {
  const store = readStore();
  const data = store[clinicId] ?? seedCrmData();
  const result = recipe(data);
  store[clinicId] = data;
  persistStore(store, true);
  return result;
}

/* --------------------------------- Clientes -------------------------------- */

export function createClient(clinicId: string, input: ClientInput): Client {
  return mutate(clinicId, (data) => {
    const now = new Date().toISOString();
    const client: Client = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      email: input.email.trim(),
      phone: input.phone.trim(),
      status: input.status,
      source: input.source,
      tags: input.tags,
      company: input.company.trim() || undefined,
      birthDate: input.birthDate || undefined,
      notes: input.notes.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };
    data.clients.push(client);
    data.activities.push({
      id: crypto.randomUUID(),
      clientId: client.id,
      kind: 'system',
      title: 'Cliente creado',
      description: `Alta manual desde el panel (origen: ${input.source}).`,
      createdAt: now,
      author: 'Sistema',
    });
    return client;
  });
}

export function updateClient(clinicId: string, id: string, input: ClientInput): Client {
  return mutate(clinicId, (data) => {
    const client = data.clients.find((item) => item.id === id);
    if (!client) throw new Error('Cliente no encontrado');

    client.name = input.name.trim();
    client.email = input.email.trim();
    client.phone = input.phone.trim();
    client.status = input.status;
    client.source = input.source;
    client.tags = input.tags;
    client.company = input.company.trim() || undefined;
    client.birthDate = input.birthDate || undefined;
    client.notes = input.notes.trim() || undefined;
    client.updatedAt = new Date().toISOString();
    return client;
  });
}

export function deleteClient(clinicId: string, id: string): void {
  mutate(clinicId, (data) => {
    data.clients = data.clients.filter((client) => client.id !== id);
    data.activities = data.activities.filter((activity) => activity.clientId !== id);
    data.tasks = data.tasks.filter((task) => task.clientId !== id);
    data.deals = data.deals.filter((deal) => deal.clientId !== id);
    data.appointments = data.appointments.filter((appointment) => appointment.clientId !== id);
    return undefined;
  });
}

/* ------------------------------- Interacciones ----------------------------- */

export function logActivity(clinicId: string, input: ActivityInput): void {
  mutate(clinicId, (data) => {
    const now = new Date().toISOString();
    data.activities.push({
      id: crypto.randomUUID(),
      clientId: input.clientId,
      kind: input.kind,
      title: input.title.trim() || 'Interacción',
      description: input.description.trim() || undefined,
      createdAt: now,
      author: 'Tú',
    });

    // Las interacciones reales cuentan como "último contacto".
    if (input.kind !== 'system') {
      const client = data.clients.find((item) => item.id === input.clientId);
      if (client) {
        client.lastContactAt = now;
        client.updatedAt = now;
      }
    }
    return undefined;
  });
}

/* -------------------------------- Seguimientos ----------------------------- */

function applyTaskInput(task: FollowUpTask, input: TaskInput): void {
  task.clientId = input.clientId;
  task.title = input.title.trim();
  task.type = input.type;
  task.priority = input.priority;
  task.dueAt = new Date(input.dueAt).toISOString();
  task.notes = input.notes.trim() || undefined;
}

export function createTask(clinicId: string, input: TaskInput): FollowUpTask {
  return mutate(clinicId, (data) => {
    const task: FollowUpTask = {
      id: crypto.randomUUID(),
      clientId: input.clientId,
      title: input.title.trim(),
      type: input.type,
      status: 'pending',
      priority: input.priority,
      dueAt: new Date(input.dueAt).toISOString(),
      notes: input.notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    data.tasks.push(task);
    return task;
  });
}

export function updateTask(clinicId: string, id: string, input: TaskInput): FollowUpTask {
  return mutate(clinicId, (data) => {
    const task = data.tasks.find((item) => item.id === id);
    if (!task) throw new Error('Seguimiento no encontrado');
    applyTaskInput(task, input);
    return task;
  });
}

export function toggleTaskDone(clinicId: string, id: string): FollowUpTask {
  return mutate(clinicId, (data) => {
    const task = data.tasks.find((item) => item.id === id);
    if (!task) throw new Error('Seguimiento no encontrado');

    if (task.status === 'done') {
      task.status = 'pending';
      task.completedAt = undefined;
    } else {
      task.status = 'done';
      task.completedAt = new Date().toISOString();
    }
    return task;
  });
}

export function deleteTask(clinicId: string, id: string): void {
  mutate(clinicId, (data) => {
    data.tasks = data.tasks.filter((task) => task.id !== id);
    return undefined;
  });
}

/* ------------------------------ Oportunidades ------------------------------ */

function applyDealInput(deal: Deal, input: DealInput): void {
  deal.clientId = input.clientId;
  deal.title = input.title.trim();
  deal.value = input.value;
  deal.stage = input.stage;
  deal.probability = input.probability;
  deal.expectedCloseAt = input.expectedCloseAt || undefined;
  deal.notes = input.notes.trim() || undefined;
  deal.updatedAt = new Date().toISOString();
}

export function createDeal(clinicId: string, input: DealInput): Deal {
  return mutate(clinicId, (data) => {
    const now = new Date().toISOString();
    const deal: Deal = {
      id: crypto.randomUUID(),
      clientId: input.clientId,
      title: input.title.trim(),
      value: input.value,
      stage: input.stage,
      probability: input.probability,
      expectedCloseAt: input.expectedCloseAt || undefined,
      notes: input.notes.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };
    data.deals.push(deal);
    return deal;
  });
}

export function updateDeal(clinicId: string, id: string, input: DealInput): Deal {
  return mutate(clinicId, (data) => {
    const deal = data.deals.find((item) => item.id === id);
    if (!deal) throw new Error('Oportunidad no encontrada');
    applyDealInput(deal, input);
    return deal;
  });
}

export function moveDealToStage(clinicId: string, id: string, stage: DealStage): Deal {
  return mutate(clinicId, (data) => {
    const deal = data.deals.find((item) => item.id === id);
    if (!deal) throw new Error('Oportunidad no encontrada');
    deal.stage = stage;
    deal.updatedAt = new Date().toISOString();

    const stageProbabilities: Record<DealStage, number> = {
      new: 20,
      contacted: 40,
      quoted: 60,
      negotiation: 75,
      won: 100,
      lost: 0,
    };
    deal.probability = stageProbabilities[stage];

    data.activities.push({
      id: crypto.randomUUID(),
      clientId: deal.clientId,
      kind: 'system',
      title: `Oportunidad movida a "${stage}"`,
      description: deal.title,
      createdAt: deal.updatedAt,
      author: 'Tú',
    });
    return deal;
  });
}

export function deleteDeal(clinicId: string, id: string): void {
  mutate(clinicId, (data) => {
    data.deals = data.deals.filter((deal) => deal.id !== id);
    return undefined;
  });
}

/* ---------------------------------- Citas ---------------------------------- */

function applyAppointmentInput(appointment: CrmAppointment, input: AppointmentInput): void {
  appointment.clientId = input.clientId;
  appointment.title = input.title.trim();
  appointment.startsAt = new Date(input.startsAt).toISOString();
  appointment.endsAt = new Date(input.endsAt).toISOString();
  appointment.status = input.status;
  appointment.notes = input.notes.trim() || undefined;
}

export function createAppointment(clinicId: string, input: AppointmentInput): CrmAppointment {
  return mutate(clinicId, (data) => {
    const appointment: CrmAppointment = {
      id: crypto.randomUUID(),
      clientId: input.clientId,
      title: input.title.trim(),
      startsAt: new Date(input.startsAt).toISOString(),
      endsAt: new Date(input.endsAt).toISOString(),
      status: input.status,
      notes: input.notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    data.appointments.push(appointment);
    return appointment;
  });
}

export function updateAppointment(
  clinicId: string,
  id: string,
  input: AppointmentInput,
): CrmAppointment {
  return mutate(clinicId, (data) => {
    const appointment = data.appointments.find((item) => item.id === id);
    if (!appointment) throw new Error('Cita no encontrada');
    applyAppointmentInput(appointment, input);
    return appointment;
  });
}

export function setAppointmentStatus(
  clinicId: string,
  id: string,
  status: AppointmentStatus,
): CrmAppointment {
  return mutate(clinicId, (data) => {
    const appointment = data.appointments.find((item) => item.id === id);
    if (!appointment) throw new Error('Cita no encontrada');
    appointment.status = status;
    return appointment;
  });
}

export function deleteAppointment(clinicId: string, id: string): void {
  mutate(clinicId, (data) => {
    data.appointments = data.appointments.filter((appointment) => appointment.id !== id);
    return undefined;
  });
}
