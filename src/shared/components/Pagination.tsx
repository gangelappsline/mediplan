import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import type { PaginationMeta } from '@/types';

interface PaginationProps {
  meta?: PaginationMeta;
  onPageChange: (page: number) => void;
}

/** Controles de paginación con los metadatos `meta` de la API (Laravel). */
function Pagination({ meta, onPageChange }: PaginationProps) {
  if (!meta || meta.last_page <= 1) {
    return meta && meta.total > 0 ? (
      <p className="text-center text-xs text-muted-foreground">{meta.total} resultados</p>
    ) : null;
  }

  return (
    <nav aria-label="Paginación" className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="text-muted-foreground">
        Mostrando {meta.from ?? 0}–{meta.to ?? 0} de {meta.total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={meta.current_page <= 1}
          onClick={() => {
            onPageChange(meta.current_page - 1);
          }}
        >
          <ChevronLeft />
          Anterior
        </Button>
        <span className="tabular-nums">
          {meta.current_page} / {meta.last_page}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={meta.current_page >= meta.last_page}
          onClick={() => {
            onPageChange(meta.current_page + 1);
          }}
        >
          Siguiente
          <ChevronRight />
        </Button>
      </div>
    </nav>
  );
}

export { Pagination };
