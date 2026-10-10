import { LoaderCircle, TriangleAlert } from 'lucide-react';
import { motion } from 'motion/react';

import { Button } from '@/shared/components/ui/button';
import { Dialog } from '@/shared/components/ui/dialog';
import { popIn } from '@/shared/lib/animations';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  isPending?: boolean;
  destructive?: boolean;
}

/** Diálogo de confirmación para acciones destructivas o irreversibles. */
function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  isPending = false,
  destructive = true,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      className="max-w-md"
      icon={
        <motion.span
          variants={popIn}
          initial="hidden"
          animate="visible"
          className={
            destructive
              ? 'flex size-11 items-center justify-center rounded-2xl bg-destructive/12 text-destructive'
              : 'flex size-11 items-center justify-center rounded-2xl bg-primary/12 text-primary'
          }
        >
          <TriangleAlert className="size-5" />
        </motion.span>
      }
    >
      <div className="space-y-5">
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant={destructive ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? <LoaderCircle className="animate-spin" /> : null}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

export { ConfirmDialog };
