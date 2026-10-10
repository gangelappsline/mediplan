import { Link } from 'react-router-dom';

import { Button, type ButtonProps } from '@/shared/components/ui/button';

interface LinkButtonProps extends ButtonProps {
  to: string;
}

/** Botón con aspecto de `Button` que navega con el router (sin `<button>` anidado). */
export function LinkButton({ to, children, ...props }: LinkButtonProps) {
  return (
    <Button asChild {...props}>
      <Link to={to}>{children}</Link>
    </Button>
  );
}
