import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/shared/lib/utils';

/**
 * Tonos semánticos para los estados que devuelve la API. Se resuelven por el
 * `name` (valor estable en inglés), no por la etiqueta.
 */
const toneByName: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  confirmed: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  completed: 'bg-sky-500/15 text-sky-700 dark:text-sky-400',
  won: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  scheduled: 'bg-primary/15 text-primary',
  new: 'bg-primary/15 text-primary',
  contacted: 'bg-sky-500/15 text-sky-700 dark:text-sky-400',
  qualified: 'bg-violet-500/15 text-violet-700 dark:text-violet-400',
  proposal: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  pending: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  suspended: 'bg-rose-500/15 text-rose-700 dark:text-rose-400',
  cancelled: 'bg-rose-500/15 text-rose-700 dark:text-rose-400',
  lost: 'bg-rose-500/15 text-rose-700 dark:text-rose-400',
  no_show: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  inactive: 'bg-muted text-muted-foreground',
};

interface StatusBadgeProps {
  name: string | null | undefined;
  label: string | null | undefined;
  className?: string;
}

/** Insignia de estado con color según `name` y texto según `label` de la API. */
function StatusBadge({ name, label, className }: StatusBadgeProps) {
  return (
    <Badge className={cn('border-transparent', toneByName[name ?? ''] ?? 'bg-muted text-muted-foreground', className)}>
      {label ?? name ?? '—'}
    </Badge>
  );
}

export { StatusBadge };
