import { ArrowUpRight, Building2, CalendarCheck, Mail, MapPin, Target, UserRound, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

import { BusinessStatusControl } from '@/features/admin/components/BusinessStatusControl';
import { Avatar } from '@/shared/components/Avatar';
import { Button } from '@/shared/components/ui/button';
import { springSoft } from '@/shared/lib/animations';
import { formatDate, timeAgo } from '@/shared/lib/format';
import type { Business } from '@/types';

interface BusinessCardProps {
  business: Business;
}

/** Tarjeta de negocio para la vista de cuadrícula del listado administrativo. */
export function BusinessCard({ business }: BusinessCardProps) {
  return (
    <motion.article
      whileHover={{ y: -3 }}
      transition={springSoft}
      className="group relative flex h-full flex-col gap-4 rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-colors hover:border-primary/40 hover:shadow-md"
    >
      <header className="flex items-start gap-3">
        <Avatar name={business.name} />
        <div className="min-w-0 flex-1">
          <Link
            to={`/admin/negocios/${business.id}`}
            className="block truncate font-semibold tracking-tight hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {business.name}
          </Link>
          <p className="truncate text-xs text-muted-foreground">
            {business.city || business.email || `Negocio #${business.id}`}
          </p>
        </div>
        <BusinessStatusControl business={business} className="w-32 shrink-0" />
      </header>

      <dl className="grid grid-cols-3 gap-2 rounded-lg bg-muted/50 p-2.5 text-center">
        <Metric icon={Users} label="Clientes" value={business.clients_count ?? null} />
        <Metric icon={Target} label="Leads" value={business.leads_count ?? null} />
        <Metric icon={CalendarCheck} label="Citas" value={business.appointments_count ?? null} />
      </dl>

      <div className="space-y-1.5 text-xs text-muted-foreground">
        <p className="flex items-center gap-2">
          <UserRound className="size-3.5 shrink-0" />
          {business.owner ? (
            <Link to={`/admin/usuarios/${business.owner.id}`} className="truncate hover:text-primary hover:underline">
              {business.owner.name}
            </Link>
          ) : (
            'Sin propietario asignado'
          )}
        </p>
        {business.email ? (
          <p className="flex items-center gap-2">
            <Mail className="size-3.5 shrink-0" />
            <span className="truncate">{business.email}</span>
          </p>
        ) : null}
        {business.city ? (
          <p className="flex items-center gap-2">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">{business.city}</span>
          </p>
        ) : null}
      </div>

      <footer className="mt-auto flex items-center justify-between gap-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Building2 className="size-3.5" />
          {business.created_at ? `${formatDate(business.created_at)} · ${timeAgo(business.created_at)}` : 'Sin fecha de alta'}
        </span>
        <Button type="button" variant="ghost" size="icon" className="size-8" asChild>
          <Link to={`/admin/negocios/${business.id}`} aria-label={`Ver detalle de ${business.name}`}>
            <ArrowUpRight className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </Button>
      </footer>
    </motion.article>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number | null;
}) {
  return (
    <div className="space-y-0.5">
      <dt className="flex items-center justify-center gap-1 text-[10px] tracking-wide text-muted-foreground uppercase">
        <Icon className="size-3" />
        {label}
      </dt>
      <dd className="text-base font-bold tabular-nums">{value === null ? '—' : value}</dd>
    </div>
  );
}
