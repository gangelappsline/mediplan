import { ArrowUpRight, Mail, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

import { BusinessStatusControl } from '@/features/admin/components/BusinessStatusControl';
import { Avatar } from '@/shared/components/Avatar';
import { StaggerItem, StaggerList } from '@/shared/components/motion/Reveal';
import { Button } from '@/shared/components/ui/button';
import { Tooltip } from '@/shared/components/ui/tooltip';
import { formatDate, timeAgo } from '@/shared/lib/format';
import type { Business } from '@/types';

interface BusinessesTableProps {
  businesses: ReadonlyArray<Business>;
}

const headClass = 'px-4 py-3 text-left text-[11px] font-semibold tracking-wider text-muted-foreground uppercase';

/** Tabla de negocios con cambio de estado en línea y acceso al detalle. */
export function BusinessesTable({ businesses }: BusinessesTableProps) {
  return (
    <div className="scroll-area overflow-x-auto rounded-xl border border-border/60 bg-card shadow-sm">
      <table className="w-full min-w-[48rem] border-collapse text-sm">
        <caption className="sr-only">Negocios registrados en la plataforma con su estado</caption>
        <thead className="border-b border-border/60 bg-muted/40">
          <tr>
            <th scope="col" className={headClass}>Negocio</th>
            <th scope="col" className={`${headClass} hidden md:table-cell`}>Ciudad</th>
            <th scope="col" className={`${headClass} hidden lg:table-cell`}>Propietario</th>
            <th scope="col" className={`${headClass} hidden sm:table-cell`}>Alta</th>
            <th scope="col" className={headClass}>Estado</th>
            <th scope="col" className={`${headClass} text-right`}>
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <StaggerList as="tbody" className="divide-y divide-border/60">
          {businesses.map((business) => (
            <StaggerItem
              as="tr"
              key={business.id}
              className="group/row transition-colors hover:bg-muted/50 focus-within:bg-muted/50"
            >
              <td className="px-4 py-3">
                <Link
                  to={`/admin/negocios/${business.id}`}
                  className="flex items-center gap-3 rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <Avatar name={business.name} size="sm" />
                  <span className="min-w-0">
                    <span className="block max-w-[15rem] truncate font-medium group-hover/row:text-primary">
                      {business.name}
                    </span>
                    <span className="flex max-w-[15rem] items-center gap-1 truncate text-xs text-muted-foreground">
                      {business.email ? <Mail className="size-3 shrink-0" /> : null}
                      {business.email ?? business.phone ?? 'Sin contacto'}
                    </span>
                  </span>
                </Link>
              </td>
              <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                {business.city ? (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-3.5 shrink-0" />
                    {business.city}
                  </span>
                ) : (
                  '—'
                )}
              </td>
              <td className="hidden px-4 py-3 lg:table-cell">
                {business.owner ? (
                  <Link to={`/admin/usuarios/${business.owner.id}`} className="text-muted-foreground transition-colors hover:text-primary hover:underline">
                    {business.owner.name}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              <td className="hidden px-4 py-3 sm:table-cell">
                {business.created_at ? (
                  <Tooltip content={timeAgo(business.created_at)}>
                    <span className="cursor-default text-muted-foreground">{formatDate(business.created_at)}</span>
                  </Tooltip>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                <BusinessStatusControl business={business} className="w-32" />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end opacity-100 transition-opacity md:opacity-0 md:group-hover/row:opacity-100 md:group-focus-within/row:opacity-100">
                  <Tooltip content="Ver detalle">
                    <Button type="button" variant="ghost" size="icon" className="size-8" asChild>
                      <Link to={`/admin/negocios/${business.id}`} aria-label={`Ver detalle de ${business.name}`}>
                        <ArrowUpRight />
                      </Link>
                    </Button>
                  </Tooltip>
                </div>
              </td>
            </StaggerItem>
          ))}
        </StaggerList>
      </table>
    </div>
  );
}
