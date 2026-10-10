import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useId } from 'react';

import { Button } from '@/shared/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { springSnappy } from '@/shared/lib/animations';
import { cn } from '@/shared/lib/utils';
import type { PaginationMeta } from '@/types';

interface PaginationProps {
  meta?: PaginationMeta;
  onPageChange: (page: number) => void;
  /** Permite cambiar `per_page` (parámetro ya soportado por la API). */
  onPerPageChange?: (perPage: number) => void;
  perPageOptions?: number[];
  className?: string;
}

/** Devuelve la secuencia de páginas a mostrar, con `null` como separador. */
function pageItems(current: number, last: number): Array<number | null> {
  if (last <= 7) return Array.from({ length: last }, (_, index) => index + 1);

  const items: Array<number | null> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(last - 1, current + 1);

  if (start > 2) items.push(null);
  for (let page = start; page <= end; page += 1) items.push(page);
  if (end < last - 1) items.push(null);
  items.push(last);

  return items;
}

/** Controles de paginación con los metadatos `meta` de la API (Laravel). */
function Pagination({ meta, onPageChange, onPerPageChange, perPageOptions = [15, 25, 50], className }: PaginationProps) {
  const layoutId = useId();

  if (!meta || meta.total === 0) return null;

  if (meta.last_page <= 1 && !onPerPageChange) {
    return (
      <p className={cn('text-center text-xs text-muted-foreground', className)}>
        {meta.total} {meta.total === 1 ? 'resultado' : 'resultados'}
      </p>
    );
  }

  return (
    <nav
      aria-label="Paginación"
      className={cn('flex flex-wrap items-center justify-between gap-3 text-sm', className)}
    >
      <p className="text-muted-foreground">
        Mostrando <span className="font-medium text-foreground tabular-nums">{meta.from ?? 0}</span>–
        <span className="font-medium text-foreground tabular-nums">{meta.to ?? 0}</span> de{' '}
        <span className="font-medium text-foreground tabular-nums">{meta.total}</span>
      </p>

      <div className="flex items-center gap-3">
        {onPerPageChange ? (
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Por página
            <Select value={String(meta.per_page)} onValueChange={(value) => onPerPageChange(Number(value))}>
              <SelectTrigger size="sm" className="w-20" aria-label="Resultados por página">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {perPageOptions.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        ) : null}

        {meta.last_page > 1 ? (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label="Página anterior"
              disabled={meta.current_page <= 1}
              onClick={() => onPageChange(meta.current_page - 1)}
            >
              <ChevronLeft />
            </Button>

            <div className="hidden items-center gap-1 sm:flex">
              {pageItems(meta.current_page, meta.last_page).map((page, index) =>
                page === null ? (
                  <span key={`gap-${index}`} className="px-1 text-muted-foreground" aria-hidden="true">
                    …
                  </span>
                ) : (
                  <button
                    key={page}
                    type="button"
                    onClick={() => onPageChange(page)}
                    aria-label={`Página ${page}`}
                    aria-current={page === meta.current_page ? 'page' : undefined}
                    className={cn(
                      'relative size-8 rounded-md text-sm font-medium outline-none transition-colors',
                      'focus-visible:ring-[3px] focus-visible:ring-ring/50',
                      page === meta.current_page ? 'text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    {page === meta.current_page ? (
                      <motion.span layoutId={`${layoutId}-page`} transition={springSnappy} className="absolute inset-0 rounded-md bg-primary" />
                    ) : null}
                    <span className="relative z-10 tabular-nums">{page}</span>
                  </button>
                ),
              )}
            </div>

            <span className="px-1 text-xs text-muted-foreground tabular-nums sm:hidden">
              {meta.current_page} / {meta.last_page}
            </span>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label="Página siguiente"
              disabled={meta.current_page >= meta.last_page}
              onClick={() => onPageChange(meta.current_page + 1)}
            >
              <ChevronRight />
            </Button>
          </div>
        ) : null}
      </div>
    </nav>
  );
}

export { Pagination };
