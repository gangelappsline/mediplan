import { CircleDollarSign, Percent, TrendingUp } from 'lucide-react';

import { useBusinessDashboard, useBusinessSettings } from '@/features/business/hooks';
import { PageHeader } from '@/shared/components/PageHeader';
import { QueryBoundary } from '@/shared/components/QueryState';
import { StatCard } from '@/shared/components/StatCard';
import { HBarChart, VBarChart } from '@/shared/components/Charts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { formatMoney } from '@/shared/lib/format';
import { LEAD_STATUS_LABEL, LEAD_STATUS_OPTIONS } from '@/features/business/labels';

/** Reportes a partir de `GET /business/dashboard`: actividad mensual, pipeline e ingresos. */
export function ReportsPage() {
  const dashboard = useBusinessDashboard();
  const settings = useBusinessSettings();
  const currency = settings.data?.currency ?? 'MXN';

  return (
    <div className="space-y-6">
      <PageHeader title="Reportes" description="Rendimiento de citas, pipeline e ingresos." />
      <QueryBoundary isLoading={dashboard.isLoading} error={dashboard.error} onRetry={() => void dashboard.refetch()}>
        {dashboard.data ? (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                title="Ingresos del mes"
                value={formatMoney(dashboard.data.appointments.revenue_this_month, currency)}
                icon={CircleDollarSign}
                tone="success"
              />
              <StatCard
                title="Tasa de conversión"
                value={`${dashboard.data.leads.conversion_rate}%`}
                hint="Leads ganados sobre el total"
                icon={Percent}
                tone="primary"
              />
              <StatCard
                title="Citas completadas (mes)"
                value={dashboard.data.appointments.completed_this_month}
                hint={`${dashboard.data.appointments.cancelled_this_month} canceladas`}
                icon={TrendingUp}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Actividad mensual</CardTitle>
                  <CardDescription>Citas agendadas por mes.</CardDescription>
                </CardHeader>
                <CardContent>
                  <VBarChart
                    data={dashboard.data.appointments.monthly_activity.map((month) => ({
                      label: month.label,
                      value: month.total,
                      hint: `${month.completed} ✓ · ${month.cancelled} ✕`,
                    }))}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pipeline por estado</CardTitle>
                  <CardDescription>Cantidad de leads en cada etapa.</CardDescription>
                </CardHeader>
                <CardContent>
                  <HBarChart
                    data={LEAD_STATUS_OPTIONS.map((option) => ({
                      label: LEAD_STATUS_LABEL[option.value],
                      value: dashboard.data.leads.by_status[option.value] ?? 0,
                    }))}
                  />
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}
      </QueryBoundary>
    </div>
  );
}
