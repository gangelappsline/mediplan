import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, type ReactNode } from 'react';

import { drawerVariants, fadeIn, tweenFast } from '@/shared/lib/animations';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/components/ui/button';

interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Contenido fijo en la parte inferior (acciones). */
  footer?: ReactNode;
  /** Icono o insignia junto al título. */
  icon?: ReactNode;
  className?: string;
  side?: 'right' | 'left';
}

/**
 * Panel lateral deslizante para previsualizar registros sin salir del listado.
 * Cierra con Escape o clic fuera, bloquea el scroll y mueve el foco al panel.
 */
function Drawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  icon,
  className,
  side = 'right',
}: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onOpenChange(false);
    }

    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onOpenChange]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={tweenFast}
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            variants={drawerVariants}
            initial={side === 'right' ? 'hidden' : { x: '-100%' }}
            animate="visible"
            exit={side === 'right' ? 'exit' : { x: '-100%' }}
            className={cn(
              'relative z-10 ml-auto flex h-full w-full max-w-md flex-col border-l bg-card shadow-2xl outline-none',
              'sm:max-w-lg',
              className,
            )}
          >
            <motion.div
              className="flex items-start justify-between gap-4 border-b px-5 py-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ ...tweenFast, delay: 0.08 }}
            >
              <div className="flex min-w-0 items-start gap-3">
                {icon ? <span className="mt-0.5 shrink-0">{icon}</span> : null}
                <div className="min-w-0 space-y-1">
                  <h2 className="truncate text-base leading-tight font-semibold tracking-tight">{title}</h2>
                  {description ? (
                    <p className="line-clamp-2 text-sm text-muted-foreground">{description}</p>
                  ) : null}
                </div>
              </div>
              <Button type="button" variant="ghost" size="icon" aria-label="Cerrar panel" onClick={() => onOpenChange(false)}>
                <X />
              </Button>
            </motion.div>
            <motion.div
              className="scroll-area flex-1 overflow-y-auto px-5 py-5"
              variants={fadeIn}
              initial="hidden"
              animate="visible"
            >
              {children}
            </motion.div>
            {footer ? (
              <motion.div
                className="border-t px-5 py-4"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...tweenFast, delay: 0.1 }}
              >
                {footer}
              </motion.div>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

export { Drawer, type DrawerProps };
