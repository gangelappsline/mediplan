import type { Client } from '@/features/crm/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';

interface ClientSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  clients: readonly Client[];
  ariaInvalid?: boolean;
  placeholder?: string;
}

/** Selector de cliente compartido por los formularios del CRM. */
function ClientSelect({
  id,
  value,
  onChange,
  clients,
  ariaInvalid,
  placeholder = 'Selecciona un cliente',
}: ClientSelectProps) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger id={id} className="w-full" aria-invalid={ariaInvalid}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {clients.map((client) => (
          <SelectItem key={client.id} value={client.id}>
            {client.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export { ClientSelect, type ClientSelectProps };
