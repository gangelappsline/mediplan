import { dealStageOrder, openDealStages } from '@/features/crm/labels';
import type {
  ActivityEvent,
  Client,
  ClientSource,
  ClientStatus,
  CrmAppointment,
  CrmData,
  Deal,
  DealStage,
  FollowUpTask,
} from '@/features/crm/types';

/**
 * Selectores derivados sobre los datos CRM: listados filtrados, métricas del
 * dashboard y agregaciones para la página de reportes.
 */

export interface ClientFilter {
  query?: string;
  status?: ClientStatus | 'all';
  source?: ClientSource | 'all';
  tag?: string;
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Filtra clientes por texto (nombre, correo, teléfono, empresa), estado, origen y etiqueta. */
export function filterClients(clients: readonly Client[], filter: ClientFilter): Client[] {
  const query = normalize(filter.query?.trim() ?? '');

  return clients
    .filter((client) => {
      if (filter.status && filter.status !== 'all' && client.status !== filter.status) return false;
      if (filter.source && filter.source !== 'all' && client.source !== filter.source) return false;
      if (filter.tag && !client.tags.includes(filter.tag)) return false;
      if (!query) return true;

      const haystack = normalize(
        [client.name, client.email, client.phone, client.company ?? '', client.tags.join(' ')].join(
          ' ',
        ),
      );
      return haystack.includes(query);
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

export function clientById(data: CrmData, id: string): Client | undefined {
  return data.clients.find((client) => client.id === id);
}

export function clientName(data: CrmData, id: string): string {
  return clientById(data, id)?.name ?? 'Cliente eliminado';
}

export function activitiesForClient(data: CrmData, clientId: string): ActivityEvent[] {
  return data.activities
    .filter((activity) => activity.clientId === clientId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function tasksForClient(data: CrmData, clientId: string): FollowUpTask[] {
  return data.tasks
    .filter((task) => task.clientId === clientId)
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
}

export function dealsForClient(data: CrmData, clientId: string): Deal[] {
  return data.deals
    .filter((deal) => deal.clientId === clientId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function appointmentsForClient(data: CrmData, clientId: string): CrmAppointment[] {
  return data.appointments
    .filter((appointment) => appointment.clientId === clientId)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
}

/* -------------------------------- Seguimientos ----------------------------- */

export function pendingTasks(data: CrmData): FollowUpTask[] {
  return data.tasks
    .filter((task) => task.status === 'pending')
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
}

export function overdueTasks(data: CrmData): FollowUpTask[] {
  const now = Date.now();
  return pendingTasks(data).filter((task) => new Date(task.dueAt).getTime() < now);
}

export function tasksDueToday(data: CrmData): FollowUpTask[] {
  const today = new Date().toDateString();
  return pendingTasks(data).filter((task) => new Date(task.dueAt).toDateString() === today);
}

export function doneTasks(data: CrmData): FollowUpTask[] {
  return data.tasks
    .filter((task) => task.status === 'done')
    .sort((a, b) => new Date(b.completedAt ?? b.dueAt).getTime() - new Date(a.completedAt ?? a.dueAt).getTime());
}

/** Seguimientos pendientes que ya vencieron o vencen hoy (cola de trabajo). */
export function todayQueue(data: CrmData): FollowUpTask[] {
  const now = Date.now();
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  return pendingTasks(data).filter((task) => new Date(task.dueAt).getTime() <= endOfToday.getTime() || new Date(task.dueAt).getTime() < now);
}

/* ---------------------------------- Citas ---------------------------------- */

export function upcomingAppointments(data: CrmData, limit?: number): CrmAppointment[] {
  const now = Date.now();
  return data.appointments
    .filter(
      (appointment) =>
        new Date(appointment.startsAt).getTime() >= now &&
        appointment.status !== 'cancelled' &&
        appointment.status !== 'completed',
    )
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    .slice(0, limit);
}

export function pastAppointments(data: CrmData, limit?: number): CrmAppointment[] {
  const now = Date.now();
  return data.appointments
    .filter((appointment) => new Date(appointment.startsAt).getTime() < now)
    .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())
    .slice(0, limit);
}

export function appointmentsThisWeek(data: CrmData): CrmAppointment[] {
  const now = Date.now();
  const end = new Date();
  end.setDate(end.getDate() + 7);
  return data.appointments.filter((appointment) => {
    const time = new Date(appointment.startsAt).getTime();
    return time >= now && time <= end.getTime() && appointment.status !== 'cancelled';
  });
}

/* --------------------------------- Pipeline -------------------------------- */

export function openDeals(data: CrmData): Deal[] {
  return data.deals.filter((deal) => openDealStages.includes(deal.stage));
}

export function openPipelineValue(data: CrmData): number {
  return openDeals(data).reduce((total, deal) => total + deal.value, 0);
}

export function wonValue(data: CrmData): number {
  return data.deals
    .filter((deal) => deal.stage === 'won')
    .reduce((total, deal) => total + deal.value, 0);
}

export function conversionRate(data: CrmData): number {
  const closed = data.deals.filter((deal) => deal.stage === 'won' || deal.stage === 'lost');
  if (closed.length === 0) return 0;
  const won = closed.filter((deal) => deal.stage === 'won').length;
  return Math.round((won / closed.length) * 100);
}

export function dealsByStage(data: CrmData): Record<DealStage, Deal[]> {
  const grouped = Object.fromEntries(
    dealStageOrder.map((stage) => [stage, [] as Deal[]]),
  ) as Record<DealStage, Deal[]>;
  for (const deal of data.deals) {
    grouped[deal.stage].push(deal);
  }
  for (const stage of dealStageOrder) {
    grouped[stage].sort((a, b) => b.value - a.value);
  }
  return grouped;
}

/* --------------------------------- Reportes -------------------------------- */

export function clientsByStatus(data: CrmData): Record<ClientStatus, number> {
  const counts: Record<ClientStatus, number> = { lead: 0, active: 0, inactive: 0, vip: 0 };
  for (const client of data.clients) {
    counts[client.status] += 1;
  }
  return counts;
}

export function clientsBySource(data: CrmData): Array<{ source: ClientSource; count: number }> {
  const counts = new Map<ClientSource, number>();
  for (const client of data.clients) {
    counts.set(client.source, (counts.get(client.source) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);
}

export function newClientsByMonth(data: CrmData, months = 6): Array<{ label: string; count: number }> {
  const now = new Date();
  const buckets: Array<{ label: string; count: number; key: string }> = [];

  for (let index = months - 1; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    buckets.push({
      label: date.toLocaleDateString('es', { month: 'short' }),
      key: `${date.getFullYear()}-${date.getMonth()}`,
      count: 0,
    });
  }

  for (const client of data.clients) {
    const created = new Date(client.createdAt);
    const key = `${created.getFullYear()}-${created.getMonth()}`;
    const bucket = buckets.find((item) => item.key === key);
    if (bucket) bucket.count += 1;
  }

  return buckets.map(({ label, count }) => ({ label, count }));
}

export function averageClientValue(data: CrmData): number {
  const won = data.deals.filter((deal) => deal.stage === 'won');
  if (won.length === 0) return 0;
  return Math.round(won.reduce((total, deal) => total + deal.value, 0) / won.length);
}

/** Estadísticas rápidas del tablero. */
export function dashboardStats(data: CrmData) {
  return {
    totalClients: data.clients.length,
    activeClients: data.clients.filter((client) => client.status === 'active' || client.status === 'vip').length,
    leads: data.clients.filter((client) => client.status === 'lead').length,
    vip: data.clients.filter((client) => client.status === 'vip').length,
    openDeals: openDeals(data).length,
    openValue: openPipelineValue(data),
    wonValue: wonValue(data),
    conversion: conversionRate(data),
    overdue: overdueTasks(data).length,
    dueToday: tasksDueToday(data).length,
    pendingTasks: pendingTasks(data).length,
    weekAppointments: appointmentsThisWeek(data).length,
  };
}
