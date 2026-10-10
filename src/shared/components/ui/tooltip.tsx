import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { motion } from 'motion/react';
import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/shared/lib/utils';
import { tweenFast } from '@/shared/lib/animations';

/**
 * Proveedor de tooltips. Se monta una sola vez en `AppProviders` para que los
 * tooltips del panel compartan retardo y se muestren rápido al pasar de uno a
 * otro.
 */
function TooltipProvider({ children }: { children: ReactNode }) {
  return (
    <TooltipPrimitive.Provider delayDuration={200} skipDelayDuration={400}>
      {children}
    </TooltipPrimitive.Provider>
  );
}

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: ComponentProps<typeof TooltipPrimitive.Content>['side'];
  align?: ComponentProps<typeof TooltipPrimitive.Content>['align'];
  className?: string;
  /** Desactiva el tooltip (p. ej. en móvil o cuando el elemento está habilitado). */
  disabled?: boolean;
}

/**
 * Tooltip accesible con entrada animada. `children` debe aceptar `ref`
 * (botones, enlaces y componentes con `asChild` funcionan directamente).
 */
function Tooltip({ content, children, side = 'top', align = 'center', className, disabled = false }: TooltipProps) {
  if (disabled) {
    return <>{children}</>;
  }

  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content asChild side={side} align={align} sideOffset={8} collisionPadding={8}>
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={tweenFast}
            className={cn(
              'z-50 max-w-64 rounded-lg bg-foreground px-2.5 py-1.5 text-xs font-medium text-background shadow-lg',
              'dark:bg-foreground dark:text-background',
              className,
            )}
          >
            {content}
            <TooltipPrimitive.Arrow className="size-2.5 fill-foreground" />
          </motion.div>
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

export { Tooltip, TooltipProvider, type TooltipProps };
