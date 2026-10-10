import type { Crumb } from '@/shared/components/Breadcrumb';
import type { NavGroup } from '@/features/panel/navigation';

const SEGMENT_LABELS: Record<string, string> = {
  nuevo: 'Nuevo',
  nueva: 'Nueva',
  editar: 'Editar',
  citas: 'Citas',
  clientes: 'Clientes',
  usuarios: 'Usuarios',
  negocios: 'Negocios',
  leads: 'Leads',
  roles: 'Roles',
  agenda: 'Agenda',
  pipeline: 'Pipeline',
  seguimientos: 'Seguimientos',
  whatsapp: 'WhatsApp',
  reportes: 'Reportes',
  configuracion: 'Configuración',
  cuenta: 'Mi cuenta',
};

function labelForSegment(segment: string): string {
  const decoded = decodeURIComponent(segment);
  if (/^\d+$/.test(decoded)) return `#${decoded}`;
  const known = SEGMENT_LABELS[decoded.toLowerCase()];
  if (known) return known;
  return decoded.charAt(0).toUpperCase() + decoded.slice(1);
}

interface BuildCrumbsOptions {
  groups: ReadonlyArray<NavGroup>;
  rootLabel: string;
  rootPath: string;
  pathname: string;
}

/**
 * Construye las migas de pan a partir de la ruta actual y la navegación del
 * rol: `Administración / Usuarios / #12 / Editar`.
 */
export function buildCrumbs({ groups, rootLabel, rootPath, pathname }: BuildCrumbsOptions): Crumb[] {
  const crumbs: Crumb[] = [{ label: rootLabel, to: rootPath }];

  const items = groups.flatMap((group) => group.items);
  let match: { to: string; label: string } | null = null;

  for (const item of items) {
    const isMatch = pathname === item.to || pathname.startsWith(`${item.to}/`);
    if (isMatch && (!match || item.to.length > match.to.length)) {
      match = { to: item.to, label: item.label };
    }
  }

  if (!match) {
    return [...crumbs, ...pathname.split('/').filter(Boolean).map((segment) => ({ label: labelForSegment(segment) }))];
  }

  if (match.to !== rootPath) crumbs.push({ label: match.label, to: match.to });

  const rest = pathname.slice(match.to.length).split('/').filter(Boolean);
  for (const segment of rest) crumbs.push({ label: labelForSegment(segment) });

  return crumbs;
}
