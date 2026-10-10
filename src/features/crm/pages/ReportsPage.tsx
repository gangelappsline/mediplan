import { ChartColumn, CircleDollarSign, Percent, Target, TrendingUp, Users } from 'lucide-react';

import { HBarChart, VBarChart, type ChartDatum } from '@/features/crm/components/Charts';
import { StatCard } from '@/features/crm/components/StatCard';
import { formatCurrency } from '@/features/crm/format';
import { clientSourceMeta, clientStatusMeta, dealStageMeta, dealStageOrder } from '@/features/crm/labels';
import { useCrm } from '@/features/crm/hooks/useCrm';
import {
  averageClientValue,
  clientsBySource,
  clientsByStatus,
  dashboardStats,
  dealsByStage,
  newClientsByMonth,
} from '@/features/crm/selectors';
import type { ClientStatus } from '@/features/crm/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { PageHeader } from '@/shared/components/PageHeader';

const statusColors: Record<ClientStatus, string> = {
  lead: 'bg-amber-500/70',
  active: 'bg-emerald-500/70',
  inactive: 'bg-muted-foreground/40',
  vip: 'bg-primary/70',
};

/** Reportes del CRM: métricas de clientes, pipeline y actividad comercial. */
function ReportsPage() {
  const { data } = useCrm();
  const stats = dashboardStats(data);
  const byStatus = clientsByStatus(data);
  const bySource = clientsBySource(data);
  const byMonth = newClientsByMonth(data, 6);
  const groupedDeals = dealsByStage(data);

  const statusData: ChartDatum[] = (Object.keys(byStatus) as ClientStatus[]).map((status) => ({
    label: clientStatusMeta[status].label,
    value: byStatus[status],
    colorClass: statusColors[status],
  }));

  const sourceData: ChartDatum[] = bySource.map(({ source, count }) => ({
    label: clientSourceMeta[source].label,
    value: count,
  }));

  const monthData: ChartDatum[] = byMonth.map((item) => ({ label: item.label, value: item.count }));

  const stageData: ChartDatum[] = dealStageOrder.map((stage) => ({
    label: dealStageMeta[stage].label,
    value: groupedDeals[stage].reduce((total, deal) => total + deal.value, 0),
    hint: formatCurrency(groupedDeals[stage].reduce((total, deal) => total + deal.value, 0)),
    colorClass: dealStageMeta[stage].barClass,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reportes"
        description="Una radiografía de tu cartera: de dónde vienen tus clientes, cómo avanza tu pipeline y cuánto valor generas."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Clientes totales"
          value={stats.totalClients}
          hint={`${stats.leads} leads · ${stats.vip} VIP`}
          icon={Users}
          tone="primary"
        />
        <StatCard
          title="Valor en pipeline"
          value={formatCurrency(stats.openValue)}
          hint={`${stats.openDeals} oportunidades abiertas`}
          icon={CircleDollarSign}
          tone="info"
        />
        <StatCard
          title="Ingresos ganados"
          value={formatCurrency(stats.wonValue)}
          hint="Oportunidades cerradas"
          icon={TrendingUp}
          tone="success"
        />
        <StatCard
          title="Tasa de conversión"
          value={`${stats.conversion}%`}
          hint="Ganadas vs. cerradas"
          icon={Percent}
          tone="warn"
        />
        <StatCard
          title="Valor promedio ganado"
          value={formatCurrency(averageClientValue(data))}
          hint="Por cliente cerrado"
          icon={Target}
          tone="primary"
        />
        <StatCard
          title="Seguimientos completados"
          value={data.tasks.filter((task) => task.status === 'done').length}
          hint={`${stats.pendingTasks} todavía pendientes`}
          icon={ChartColumn}
          tone="info"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Nuevos clientes por mes</CardTitle>
            <CardDescription>Altas registradas en los últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <VBarChart data={monthData} />
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Clientes por estado</CardTitle>
            <CardDescription>Distribución actual de tu cartera</CardDescription>
          </CardHeader>
          <CardContent>
            <HBarChart data={statusData} />
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Origen de los clientes</CardTitle>
            <CardDescription>Canales que más clientes te traen</CardDescription>
          </CardHeader>
          <CardContent>
            <HBarChart data={sourceData} />
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Valor del pipeline por etapa</CardTitle>
            <CardDescription>Suma de oportunidades en cada etapa</CardDescription>
          </CardHeader>
          <CardContent>
            <HBarChart data={stageData} />
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Detalle del pipeline</CardTitle>
          <CardDescription>Cantidad y valor de oportunidades por etapa</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Etapa</th>
                  <th className="py-2 pr-4 font-medium">Oportunidades</th>
                  <th className="py-2 pr-4 font-medium">Valor total</th>
                  <th className="py-2 font-medium">Valor promedio</th>
                </tr>
              </thead>
              <tbody>
                {dealStageOrder.map((stage) => {
                  const deals = groupedDeals[stage];
                  const total = deals.reduce((sum, deal) => sum + deal.value, 0);
                  return (
                    <tr key={stage} className="border-b border-border/60 last:border-0">
                      <td className="py-2.5 pr-4">
                        <span className="inline-flex items-center gap-2">
                          <span
                            className={`size-2 rounded-full ${dealStageMeta[stage].barClass}`}
                            aria-hidden="true"
                          />
                          {dealStageMeta[stage].label}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 tabular-nums">{deals.length}</td>
                      <td className="py-2.5 pr-4 font-medium tabular-nums">{formatCurrency(total)}</td>
                      <td className="py-2.5 tabular-nums">
                        {formatCurrency(deals.length > 0 ? Math.round(total / deals.length) : 0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export { ReportsPage };
