import {
  Checkbox as CheckboxPrimitive,
  CheckboxIndicator as CheckboxIndicatorPrimitive,
  type CheckboxProps as CheckboxPrimitiveProps,
} from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';

import { cn } from '@/shared/lib/utils';

type CheckboxProps = CheckboxPrimitiveProps;

function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <CheckboxPrimitive
      data-slot="checkbox"
      className={cn(
        'peer size-4 shrink-0 rounded-[4px] border shadow-xs outline-none transition-colors',
        'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
        'aria-invalid:border-destructive',
        className,
      )}
      {...props}
    >
      <CheckboxIndicatorPrimitive className="flex items-center justify-center text-current">
        <Check className="size-3.5" />
      </CheckboxIndicatorPrimitive>
    </CheckboxPrimitive>
  );
}

export { Checkbox, type CheckboxProps };
