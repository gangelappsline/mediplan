import {
  BadgeDollarSign,
  Building2,
  CalendarClock,
  Clock,
  Mail,
  MessageSquare,
  Phone,
  Sparkles,
  Target,
  UserRound,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { LEAD_STATUS_LABEL, leadSourceLabel } from '@/features/business/labels';
import { Avatar } from '@/shared/components/Avatar';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { Button } from '@/shared/components/ui/button';
import { Drawer } from '@/shared/components/ui/drawer';
import { dayDiff, formatDate, formatDateTime, formatMoney, timeAgo } from '@/shared/lib/format';
import { cn } from '@/shared/lib/utils';
import type { Lead, LeadStatusName } from '@/types';

interface LeadDetailDrawerProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Previsualización de un lead de la plataforma sin salir del listado. Toda la
 * información viene del registro ya cargado por `GET /admin/leads` (solo lectura).
 */
export function LeadDetailDrawer({ lead, open, onOpenChange }: LeadDetailDrawerProps) {
  if (!lead) return null;

  const followUpDiff = lead.follow_up_at ? dayDiff(lead.follow_up_at) : null;
  const isOverdue = followUpDiff !== null && followUpDiff < 0 && lead.status.name !== 'won' && lead.status.name !== 'lost';

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={lead.name}
      description={[lead.company, lead.email ?? lead.phone].filter(Boolean).join(' · ') || 'Lead de la plataforma'}
      icon={<Avatar name={lead.name} size="sm" />}
      footer={
        <div className="flex items-center justify-between gap-2">
          <Button type="button" variant="ghost" size="sm" asChild>
            <Link to={`/admin/negocios/${lead.business_id}`}>
              <Building2 />
              Ver negocio
            </Link>
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge
            name={lead.status.name}
            label={LEAD_STATUS_LABEL[lead.status.name as LeadStatusName] ?? lead.status.label}
          />
          {lead.estimated_value !== null ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/12 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <BadgeDollarSign className="size-3.5" />
              {formatMoney(lead.estimated_value)}
            </span>
          ) : null}
          {lead.converted_at ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/12 px-2.5 py-1 text-xs font-semibold text-primary">
              <Sparkles className="size-3.5" />
              Convertido {timeAgo(lead.converted_at)}
            </span>
          ) : null}
        </div>

        <Section title="Contacto" icon={UserRound}>
          <Row icon={Mail} label="Correo" value={lead.email} href={lead.email ? `mailto:${lead.email}` : undefined} />
          <Row icon={Phone} label="Teléfono" value={lead.phone} href={lead.phone ? `tel:${lead.phone}` : undefined} />
          <Row icon={Building2} label="Empresa" value={lead.company} />
          <Row icon={MessageSquare} label="Origen" value={leadSourceLabel(lead.source)} />
          <Row icon={Target} label="Negocio" value={`#${lead.business_id}`} to={`/admin/negocios/${lead.business_id}`} />
        </Section>

        <Section title="Seguimiento" icon={CalendarClock}>
          <Row
            icon={CalendarClock}
            label="Próximo contacto"
            value={lead.follow_up_at ? formatDateTime(lead.follow_up_at) : null}
            tone={isOverdue ? 'danger' : undefined}
            extra={
              lead.follow_up_at
                ? isOverdue
                  ? `Vencido hace ${Math.abs(followUpDiff ?? 0)} día(s)`
                  : followUpDiff === 0
                    ? 'Hoy'
                    : `En ${followUpDiff} día(s)`
                : undefined
            }
          />
          <Row icon={Clock} label="Contactado" value={lead.contacted_at ? formatDateTime(lead.contacted_at) : null} />
          <Row icon={Clock} label="Alta" value={lead.created_at ? formatDate(lead.created_at) : null} />
          <Row
            icon={UserRound}
            label="Asignado a"
            value={lead.assigned_to?.name}
            to={lead.assigned_to ? `/admin/usuarios/${lead.assigned_to.id}` : undefined}
          />
        </Section>

        <Section title="Notas" icon={MessageSquare}>
          {lead.notes ? (
            <p className="rounded-lg bg-muted/60 p-3 text-sm whitespace-pre-line">{lead.notes}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Este lead no tiene notas.</p>
          )}
        </Section>

        {lead.converted_client ? (
          <Section title="Cliente convertido" icon={Sparkles}>
            <div className="rounded-lg border border-primary/25 bg-primary/5 p-3 text-sm">
              <p className="font-medium">{lead.converted_client.name}</p>
              <p className="text-xs text-muted-foreground">
                {[lead.converted_client.email, lead.converted_client.phone].filter(Boolean).join(' · ') || 'Sin contacto'}
              </p>
              {lead.converted_at ? (
                <p className="mt-1 text-xs text-muted-foreground">Convertido {timeAgo(lead.converted_at)}</p>
              ) : null}
            </div>
          </Section>
        ) : null}
      </div>
    </Drawer>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof UserRound;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2.5">
      <h3 className="flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        <Icon className="size-3.5" />
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

interface RowProps {
  icon: typeof UserRound;
  label: string;
  value: string | null | undefined;
  href?: string;
  to?: string;
  tone?: 'danger';
  extra?: string;
}

function Row({ icon: Icon, label, value, href, to, tone, extra }: RowProps) {
  const content = (
    <>
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-3.5 shrink-0" />
        {label}
      </span>
      <span className="flex min-w-0 items-baseline justify-end gap-2 text-right">
        {extra ? (
          <span
            className={cn(
              'shrink-0 text-[11px] font-medium',
              tone === 'danger' ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground',
            )}
          >
            {extra}
          </span>
        ) : null}
        <span className={cn('truncate font-medium', tone === 'danger' && 'text-rose-600 dark:text-rose-400')}>
          {value || '—'}
        </span>
      </span>
    </>
  );

  const className = 'flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm transition-colors';

  if (to) {
    return (
      <Link to={to} className={cn(className, 'hover:bg-muted/60 hover:text-primary')}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={cn(className, 'hover:bg-muted/60 hover:text-primary')}>
        {content}
      </a>
    );
  }

  return <div className={className}>{content}</div>;
}
