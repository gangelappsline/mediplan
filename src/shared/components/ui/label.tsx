import { Label as LabelPrimitive } from '@radix-ui/react-label';
import type { ComponentProps } from 'react';

import { cn } from '@/shared/lib/utils';

type LabelProps = ComponentProps<typeof LabelPrimitive>;

function Label({ className, ...props }: LabelProps) {
  return (
    <LabelPrimitive
      data-slot="label"
      className={cn(
        'flex items-center gap-2 select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50',
        'text-sm leading-none font-medium',
        'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export { Label, type LabelProps };
