import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import type { CrmIcon } from '@/features/crm/labels';
import { Card, CardContent } from '@/shared/components/ui/card';
import { cn } from '@/shared/lib/utils';

const tones = {
  default: 'bg-muted text-muted-foreground',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  warn: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  danger: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  info: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
} as const;

interface StatCardProps {
  title: string;
  value: ReactNode;
  hint?: string;
  icon: CrmIcon;
  tone?: keyof typeof tones;
  /** Enlace opcional: la tarjeta entera navega a la página del módulo. */
  href?: string;
}

/** Tarjeta KPI compacta para el dashboard y reportes. */
function StatCard({ title, value, hint, icon: Icon, tone = 'default', href }: StatCardProps) {
  const body = (
    <CardContent className="flex items-start justify-between gap-3">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', tones[tone])}>
        <Icon className="size-5" />
      </div>
    </CardContent>
  );

  if (href) {
    return (
      <Link
        to={href}
        className="group block rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <Card className="h-full border-border/60 transition-all group-hover:-translate-y-0.5 group-hover:border-primary/40 group-hover:shadow-md">
          {body}
        </Card>
      </Link>
    );
  }

  return <Card className="border-border/60">{body}</Card>;
}

export { StatCard, type StatCardProps };
