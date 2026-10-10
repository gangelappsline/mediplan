import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  /** Contenido adicional bajo el título (filtros, pestañas…). */
  children?: ReactNode;
}

/** Cabecera estándar de las páginas del panel: título, descripción y acciones. */
function PageHeader({ title, description, actions, children }: PageHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          {description ? (
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}

export { PageHeader, type PageHeaderProps };
