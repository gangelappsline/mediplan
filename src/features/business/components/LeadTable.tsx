import { Link } from 'react-router-dom';

import { LEAD_STATUS_LABEL } from '@/features/business/labels';
import { Avatar } from '@/shared/components/Avatar';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { Card } from '@/shared/components/ui/card';
import { formatDate, formatMoney, formatRelativeDay } from '@/shared/lib/format';
import type { Lead } from '@/types';

/** Tabla de leads compartida por el pipeline y los seguimientos. */
export function LeadTable({ leads, showFollowUp = false }: { leads: Lead[]; showFollowUp?: boolean }) {
  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b text-left text-xs text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Lead</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">Contacto</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Valor</th>
              <th className="hidden px-4 py-3 font-medium lg:table-cell">
                {showFollowUp ? 'Seguimiento' : 'Alta'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-muted/40">
                <td className="px-4 py-3">
                  <Link to={`/dashboard/pipeline/${lead.id}`} className="flex items-center gap-3">
                    <Avatar name={lead.name} size="sm" />
                    <span className="min-w-0">
                      <span className="block truncate font-medium hover:underline">{lead.name}</span>
                      {lead.company ? <span className="block truncate text-xs text-muted-foreground">{lead.company}</span> : null}
                    </span>
                  </Link>
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{lead.email ?? lead.phone ?? '—'}</td>
                <td className="px-4 py-3">
                  <StatusBadge name={lead.status.name} label={LEAD_STATUS_LABEL[lead.status.name as keyof typeof LEAD_STATUS_LABEL] ?? lead.status.label} />
                </td>
                <td className="hidden px-4 py-3 tabular-nums sm:table-cell">
                  {lead.estimated_value !== null ? formatMoney(lead.estimated_value) : '—'}
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                  {showFollowUp
                    ? lead.follow_up_at
                      ? formatRelativeDay(lead.follow_up_at)
                      : '—'
                    : lead.created_at
                      ? formatDate(lead.created_at)
                      : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
