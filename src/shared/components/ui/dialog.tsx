import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, type ReactNode } from 'react';

import { Button } from '@/shared/components/ui/button';
import { springGentle } from '@/shared/lib/animations';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { cn } from '@/shared/lib/utils';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  /** Icono destacado junto al título (confirmaciones, avisos…). */
  icon?: ReactNode;
}

/**
 * Diálogo modal ligero (sin Radix): overlay con blur, cierre con Escape o
 * clic fuera, bloqueo de scroll y animación de entrada respetando
 * `prefers-reduced-motion`.
 */
function Dialog({ open, onOpenChange, title, description, children, className, icon }: DialogProps) {
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    panelRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onOpenChange(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onOpenChange]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto p-4 sm:items-center">
          <motion.div
            aria-hidden="true"
            className="fixed inset-0 bg-black/55 backdrop-blur-[2px]"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => {
              onOpenChange(false);
            }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            ref={panelRef}
            tabIndex={-1}
            className={cn(
              'scroll-area relative z-10 my-8 max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border/70 bg-card p-6 text-card-foreground shadow-2xl outline-none',
              className,
            )}
            initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 10, scale: 0.98 }}
            transition={springGentle}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                {icon ? <span className="mt-0.5 shrink-0">{icon}</span> : null}
                <div className="min-w-0 space-y-1">
                  <h2 className="text-lg leading-tight font-semibold tracking-tight">{title}</h2>
                  {description ? (
                    <p className="text-sm text-muted-foreground">{description}</p>
                  ) : null}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Cerrar diálogo"
                onClick={() => {
                  onOpenChange(false);
                }}
              >
                <X />
              </Button>
            </div>
            <div className="mt-5">{children}</div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

export { Dialog, type DialogProps };
